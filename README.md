# DockerHub MCP Server

An MCP server that exposes Docker Hub & OCI registry features to AI assistants.

## Quick Start

```bash
pnpm i
cp .env.example .env
# Fill DOCKERHUB_* if needed
pnpm run dev