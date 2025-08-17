# DockerHub MCP Server

An MCP server that exposes Docker Hub & OCI registry features to AI assistants.

## Quick Start

```bash
pnpm i
cp .env.example .env
# Fill DOCKERHUB_* if needed
pnpm run dev

```

## Test command

```bash
pnpm jest --clearCache
pnpm test

```

# MCP server congiguration
```
{
  "mcpServers": {
    "dockerhub": {
      "command": "node",
      "args": ["/Users/mukeshkumar/Desktop/Dockerhub-mcp-server/dist/index.js"],
      "env": {
        "DOCKERHUB_USERNAME": "error412",
        "DOCKERHUB_TOKEN": "Gudu@0422"
      },
      "disabled": false
    }
  }
}
```

 