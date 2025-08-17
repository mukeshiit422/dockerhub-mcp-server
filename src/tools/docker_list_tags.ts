import { z } from "zod";
import { tool } from "../mcp.js";
import { DockerHubClient } from "../dockerhub/client.js";

export default function register(server: any) {
  const input = z.object({ repository: z.string(), page: z.number().int().min(1).optional(), pageSize: z.number().int().min(1).max(100).optional() });
  tool(server, "docker_list_tags", input, async ({ repository, page = 1, pageSize = 50 }) => {
    const [namespace, name] = repository.split("/");
    const hub = new DockerHubClient();
    const data = await hub.listTags(namespace, name, page, pageSize);
    return {
      count: data.count,
      results: data.results?.map((t: any) => ({
        name: t.name,
        last_updated: t.last_updated,
        full_size: t.full_size,
        digest: t.digest
      }))
    };
  });
}