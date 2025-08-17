import { z } from "zod";
import { tool } from "../mcp.js";
import { DockerHubClient } from "../dockerhub/client.js";

export default function register(server: any) {
  const input = z.object({ repository: z.string() });
  tool(server, "docker_get_stats", input, async ({ repository }) => {
    const [namespace, name] = repository.split("/");
    const hub = new DockerHubClient();
    const repo = await hub.getRepository(namespace, name);
    return { star_count: repo.star_count, pull_count: repo.pull_count, last_updated: repo.last_updated };
  });
}