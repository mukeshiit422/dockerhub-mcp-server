import axios, { AxiosInstance, AxiosError } from "axios";
import { memo } from "../util/cache.js";
import pLimit from "p-limit";

const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY || 6);
const limit = pLimit(MAX_CONCURRENCY);

function assertEnvString(name: string, val?: string) {
  if (val && typeof val === "string" && val.trim().length > 0) return val.trim();
  return undefined;
}

export class DockerHubClient {
  private http: AxiosInstance;

  constructor(private base = "https://hub.docker.com") {
    this.http = axios.create({ baseURL: base, timeout: 15000 });
  }

  // Exchange credentials -> short-lived Hub bearer for Hub API (NOT the OCI registry API)
  private async getHubBearer(): Promise<string | undefined> {
    const username = assertEnvString("DOCKERHUB_USERNAME", process.env.DOCKERHUB_USERNAME);
    const password = assertEnvString("DOCKERHUB_PASSWORD", process.env.DOCKERHUB_PASSWORD);
    const pat      = assertEnvString("DOCKERHUB_TOKEN", process.env.DOCKERHUB_TOKEN); // personal/org access token

    // Unauthenticated (public) mode: lower rate limits, but works.
    if (!username || (!password && !pat)) return undefined;

    // Cache briefly to avoid hammering Hub
    return memo("short", `hub:bearer:${username}:${Boolean(pat)}`, async () => {
      const body: Record<string, string> = { username };
      if (pat && !password) body.access_token = pat;           // PAT/OAT flow
      else if (password && !pat) body.password = password;     // password flow
      else if (pat && password) throw new Error("Provide either DOCKERHUB_PASSWORD or DOCKERHUB_TOKEN, not both.");

      try {
        // Hub’s “Create access token” (short-lived JWT) for Hub API calls
        const res = await this.http.post("/v2/auth/token/", body, {  // note trailing slash
          headers: { "Content-Type": "application/json" }
        });
        const token = res.data?.access_token || res.data?.token;
        if (!token) throw new Error("No bearer token returned from /v2/auth/token.");
        return token as string;
      } catch (e) {
        const ax = e as AxiosError<any>;
        // Helpful diagnostics if the body was wrong
        const detail = ax.response?.data ?? ax.message;
        // Fallback for older accounts/endpoints (password or PAT passed as password)
        if (ax.response?.status === 400) {
          // Try legacy login route (works with username/password; some setups also accept PAT as password)
          const legacy = await this.http.post("/v2/users/login/", {
            username, password: password ?? pat
          }, { headers: { "Content-Type": "application/json" } });
          const token = legacy.data?.token;
          if (!token) throw new Error(`Legacy login returned no token. Server said: ${JSON.stringify(detail)}`);
          return token;
        }
        throw new Error(`Hub auth failed: ${JSON.stringify(detail)}`);
      }
    });
  }

  private async authHeaders() {
    const bearer = await this.getHubBearer();
    return bearer ? { Authorization: `Bearer ${bearer}` } : {};
  }

  searchRepositories(query: string, page = 1, pageSize = 25) {
    return limit(() =>
      memo("short", `search:${query}:${page}:${pageSize}`, async () => {
        const res = await this.http.get("/v2/search/repositories/", {
          params: { query, page, page_size: pageSize },
          headers: await this.authHeaders()
        });
        return res.data;
      })
    );
  }

  getRepository(namespace: string, name: string) {
    return limit(() =>
      memo("medium", `repo:${namespace}/${name}`, async () => {
        const res = await this.http.get(`/v2/repositories/${namespace}/${name}/`, {
          headers: await this.authHeaders()
        });
        return res.data;
      })
    );
  }

  listTags(namespace: string, name: string, page = 1, pageSize = 50) {
    return limit(() =>
      memo("short", `tags:${namespace}/${name}:${page}:${pageSize}`, async () => {
        const res = await this.http.get(`/v2/repositories/${namespace}/${name}/tags/`, {
          params: { page, page_size: pageSize, ordering: "last_updated" },
          headers: await this.authHeaders()
        });
        return res.data;
      })
    );
  }
}
