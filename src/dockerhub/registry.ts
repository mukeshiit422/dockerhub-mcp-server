import axios from "axios";
import { memo } from "../util/cache.js";

type Platform = { os?: string; architecture?: string; variant?: string };

// Accept both index and single-manifest media types
const ACCEPT = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json"
].join(", ");

export class RegistryClient {
  constructor(private repo: string) {}

  private async bearer(scope: string): Promise<string> {
    const url = "https://auth.docker.io/token";
    const params = { service: "registry.docker.io", scope };
    const res = await axios.get(url, { params, timeout: 15000 });
    return res.data.access_token as string;
  }

  private async headers(scope: string) {
    const token = await memo("short", `bearer:${scope}`, () => this.bearer(scope));
    return { Authorization: `Bearer ${token}`, Accept: ACCEPT };
  }

  async getManifest(reference = "latest") {
    const scope = `repository:${this.repo}:pull`;
    const headers = await this.headers(scope);
    const url = `https://registry-1.docker.io/v2/${this.repo}/manifests/${reference}`;
    const res = await axios.get(url, { headers, timeout: 20000 });
    return res.data; // could be index or a single manifest
  }

  /**
   * Resolve multi-arch index to a specific platform manifest (default linux/amd64).
   * Returns a single image manifest with layers[].
   */
  async getManifestResolved(reference = "latest", platform: Platform = { os: "linux", architecture: "amd64" }) {
    const scope = `repository:${this.repo}:pull`;
    const headers = await this.headers(scope);
    const baseUrl = `https://registry-1.docker.io/v2/${this.repo}`;

    // 1) Fetch whatever the tag points to (index or single manifest)
    const head = await axios.get(`${baseUrl}/manifests/${reference}`, { headers, timeout: 20000 });
    const data = head.data;

    // If it already looks like a single manifest, return as-is
    if (data.layers || data.config) return data;

    // 2) Otherwise treat as index and pick a manifest for the desired platform
    const manifests: any[] = data.manifests || [];
    const match = manifests.find((m: any) => {
      const p = m.platform || {};
      const osOK = !platform.os || p.os === platform.os;
      const archOK = !platform.architecture || p.architecture === platform.architecture;
      const varOK = !platform.variant || p.variant === platform.variant;
      return osOK && archOK && varOK;
    }) || manifests[0];

    if (!match?.digest) {
      throw new Error("Could not resolve a platform-specific manifest from the index.");
    }

    // 3) Fetch the selected manifest by digest
    const res = await axios.get(`${baseUrl}/manifests/${match.digest}`, { headers, timeout: 20000 });
    return res.data;
  }

  async getBlob(digest: string) {
    const scope = `repository:${this.repo}:pull`;
    const headers = await this.headers(scope);
    const url = `https://registry-1.docker.io/v2/${this.repo}/blobs/${digest}`;
    const res = await axios.get(url, { headers, timeout: 20000 });
    return res.data;
  }
}
