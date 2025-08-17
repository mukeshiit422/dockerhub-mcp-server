import { z } from "zod";
import { tool } from "../mcp.js";
import { RegistryClient } from "../dockerhub/registry.js";

/** Best-effort extraction: looks into config blob history for Dockerfile (when provided) */
export default function register(server: any) {
  const input = z.object({ repository: z.string(), reference: z.string().optional() });
  tool(server, "docker_get_dockerfile", input, async ({ repository, reference = "latest" }) => {
    const rc = new RegistryClient(repository);
    const m = await rc.getManifest(reference);
    if (!m.config?.digest) return { found: false, reason: "No config digest present" };
    const cfg = await rc.getBlob(m.config.digest);
    // Some images embed Dockerfile or history with created_by lines approximating Dockerfile steps
    const history = (cfg.history || []) as Array<{ created_by?: string; empty_layer?: boolean }>;
    const lines = history.map((h) => h.created_by).filter(Boolean) as string[];
    if (!lines.length) return { found: false, reason: "No Dockerfile metadata in config history" };
    return { found: true, dockerfile_like: lines.join("\n") };
  });
}