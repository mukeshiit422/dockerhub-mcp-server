import { z } from "zod";
import { tool } from "../mcp.js";
import { RegistryClient } from "../dockerhub/registry.js";
import { estimatePullSize } from "../dockerhub/parsers.js";

export default function register(server: any) {
  const input = z.object({
    repository: z.string(),
    reference: z.string().optional(),
    platform: z.object({
      os: z.string().default("linux"),
      architecture: z.string().default("amd64"),
      variant: z.string().optional()
    }).optional()
  });

  tool(server, "docker_analyze_layers", input, async ({ repository, reference = "latest", platform }) => {
    const rc = new RegistryClient(repository);
    const manifest = await rc.getManifestResolved(reference, platform ?? { os: "linux", architecture: "amd64" });
    const total = estimatePullSize(manifest);
    const layers = (manifest.layers || []).map((l: any, i: number) => ({
      index: i, mediaType: l.mediaType, digest: l.digest, size: l.size
    }));
    return { total_size: total, layer_count: layers.length, layers };
  });
}
