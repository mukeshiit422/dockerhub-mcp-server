import "dotenv/config";
import { DockerHubClient } from "../src/dockerhub/client.js";
import { RegistryClient } from "../src/dockerhub/registry.js";

function repoSlugFromSearchItem(r: any): string {
  // Prefer combined repo_name first (e.g., "library/python")
  const combined = r?.repo_name || r?.slug || r?.repository;
  if (combined) return combined;

  // Fall back to namespace/name if present
  if (r?.namespace && r?.name) return `${r.namespace}/${r.name}`;

  // Sometimes results are nested under "summaries" with different keys
  const ns = r?.namespace?.name ?? r?.owner ?? r?.user ?? "unknown";
  const nm = r?.name ?? r?.repo ?? r?.image ?? "unknown";
  return `${ns}/${nm}`;
}

async function main() {
  const hub = new DockerHubClient();

  // 1) Search
  const search = await hub.searchRepositories("python", 1, 5);
  const list = (search.results || search.summaries || []).slice(0, 5);
  console.log(
    "Search results (top 5):",
    list.map((r: any) => repoSlugFromSearchItem(r))
  );

  // 2) Repo details
  const repo = await hub.getRepository("library", "python");
  console.log("Repo details:", { stars: repo.star_count, pulls: repo.pull_count, updated: repo.last_updated });

  // 3) Manifest + layer analysis (resolve multi-arch to linux/amd64)
  const rc = new RegistryClient("library/ubuntu");
  const manifest = await rc.getManifestResolved("22.04", { os: "linux", architecture: "amd64" });
  const total = (manifest.layers || []).reduce((s: number, l: any) => s + (l.size || 0), 0);
  console.log("Ubuntu 22.04 layer count:", manifest.layers?.length, "approx total bytes:", total);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
