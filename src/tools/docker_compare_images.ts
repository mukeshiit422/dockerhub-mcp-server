import { z } from "zod";
import { tool } from "../mcp.js";
import { RegistryClient } from "../dockerhub/registry.js";
import { compareManifests, estimatePullSize } from "../dockerhub/parsers.js";

export default function register(server: any) {
  const img = z.object({
    repository: z.string(),
    reference: z.string().optional(),
    platform: z.object({
      os: z.string().default("linux"),
      architecture: z.string().default("amd64"),
      variant: z.string().optional()
    }).optional()
  });

  const input = z.object({ a: img, b: img });

  tool(server, "docker_compare_images", input, async ({ a, b }) => {
    const ra = new RegistryClient(a.repository);
    const rb = new RegistryClient(b.repository);
    const aPlatform = a && a.platform ? a.platform  : { os: "linux", architecture: "amd64" };
    const bPlatform = b && b.platform ? b.platform : { os: "linux", architecture: "amd64" };
    const [ma, mb] = await Promise.all([
      ra.getManifestResolved(a.reference || "latest", aPlatform),
      rb.getManifestResolved(b.reference || "latest", bPlatform)
    ]);
    const cmp = compareManifests(ma, mb);
    return {
      a: { total_size: estimatePullSize(ma) },
      b: { total_size: estimatePullSize(mb) },
      ...cmp
    };
  });
}
