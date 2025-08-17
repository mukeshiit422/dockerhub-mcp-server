import { z } from "zod";
import { tool } from "../mcp.js";
import { RegistryClient } from "../dockerhub/registry.js";

export default function register(server: any) {
  const input = z.object({ repository: z.string(), reference: z.string().optional() });
  tool(server, "docker_get_manifest", input, async ({ repository, reference = "latest" }) => {
    const rc = new RegistryClient(repository);
    const manifest = await rc.getManifest(reference);
    return manifest;
  });
}