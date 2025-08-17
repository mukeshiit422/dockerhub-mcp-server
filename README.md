# DockerHub MCP Server

An MCP server that exposes Docker Hub & OCI registry features to AI assistants.

## Quick Start

```bash
pnpm i
cp .env.example .env
pnpm run dev

```

## Test command

```bash
pnpm jest --clearCache
pnpm test

```

## MCP server local congiguration
```json
{
  "mcpServers": {
    "dockerhub": {
      "command": "node",
      "args": ["/absolute_path/dockerhub-mcp-server/dist/index.js"],
      "env": {
        "DOCKERHUB_USERNAME": "",
        "DOCKERHUB_PASSWORD": "",
      },
      "disabled": false
    }
  }
}
```

## MCP server docker congiguration
```json
{
  "mcpServers": {
    "dockerhub": {
      "command": "docker",
      "args": [
        "run","--rm","-i",
        "-e","DOCKERHUB_USERNAME=your-user",
        "-e","DOCKERHUB_PASSWORD=your-password",
        "{repo_name}:latest"
      ],
      "disabled": false
    }
  }
}
```


 