import { z } from "zod";
import { tool } from "../mcp.js";
import { DockerHubClient } from "../dockerhub/client.js";

export default function register(server: any) {
  const input = z.object({
    query: z.string(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional()
  });

  tool(server, "docker_search_images", input, async ({ query, page = 1, pageSize = 25 }) => {
    const hub = new DockerHubClient();
    const res = await hub.searchRepositories(query, page, pageSize);
    const rows = (res.results || res.summaries || []).map((r: any) => {
      const repo_name = r.repo_name || r.slug || r.repository || (r.namespace && r.name ? `${r.namespace}/${r.name}` : undefined);
      const [namespace, name] = repo_name ? String(repo_name).split("/") : [r.namespace, r.name];
      return {
        name,
        namespace,
        description: r.short_description ?? r.description,
        star_count: r.star_count ?? r.stars ?? r.like_count,
        pull_count: r.pull_count ?? r.downloads,
        last_updated: r.last_updated ?? r.updated_at ?? r.last_pushed
      };
    });

    return { count: res.count ?? rows.length, results: rows };
  });
}
