import "dotenv/config";
import { createServer } from "./mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import register_search from "./tools/docker_search_images.js";
import register_details from "./tools/docker_get_image_details.js";
import register_tags from "./tools/docker_list_tags.js";
import register_manifest from "./tools/docker_get_manifest.js";
import register_layers from "./tools/docker_analyze_layers.js";
import register_compare from "./tools/docker_compare_images.js";
import register_dockerfile from "./tools/docker_get_dockerfile.js";
import register_stats from "./tools/docker_get_stats.js";
import register_ping from "./tools/ping.js";

process.on('uncaughtException', e => console.error('uncaughtException:', e));
process.on('unhandledRejection', e => console.error('unhandledRejection:', e));
process.on('exit', code => console.error('process exit code:', code));

async function main() {
  const server = createServer();

  // Register tools
  register_search(server);
  register_details(server);
  register_tags(server);
  register_manifest(server);
  register_layers(server);
  register_compare(server);
  register_dockerfile(server);
  register_stats(server);
  register_ping(server);

  // Connect over stdio (SDK v1+)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("dockerhub-mcp-server running on stdio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
