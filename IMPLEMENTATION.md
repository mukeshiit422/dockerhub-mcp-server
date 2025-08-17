# IMPLEMENTATION.md

A practical walkthrough of architecture, design choices, auth flows, caching/rate‑limit strategy, error handling, and future improvements for **dockerhub-mcp-server**.

---

## 1 Goals 

**Goals**

* Provide MCP tools for Docker Hub & OCI registry operations (search, details, tags, manifests, layer analysis, compare, stats) usable by AI assistants.
* Production‑ready ergonomics: typed inputs with Zod, helpful errors, caching, and rate‑limit safety.
* Work out‑of‑the‑box with popular MCP clients Cline via **stdio** transport.

---

## 2 High‑Level Architecture

```
MCP Client Cline
    │  stdio (MCP)
    ▼
McpServer (src/mcp.ts)
  ├─ Tool registry (zod-validated wrappers)
  └─ Tool handlers (src/tools/*)
        ├─ DockerHubClient  →  hub.docker.com Hub API (search/repo/tags)
        └─ RegistryClient   →  registry-1.docker.io OCI Registry (manifests/blobs)

Cross-cutting:
  - LRU caches (short/medium/long)  - Concurrency limiter (p-limit)
  - Error normalization              - Env-based configuration
```

---

## 3 Key Components

* **McpServer & transport**: ESM imports via `@modelcontextprotocol/sdk/server/mcp.js` and `.../stdio.js`. NodeNext ESM config lets us import `.js` in source so the same paths work after build.
* **Tool helper**: Generic `tool<S extends z.AnyZodObject, O>(...)` ensures strong typing for handler args while conforming to SDK’s `ZodRawShape` requirement.
* **DockerHubClient**: Wraps **Hub API** (search, repo, tags). Performs **bearer exchange** via `/v2/auth/token/` using either username+password or username+PAT (access\_token). Short‑lived bearer is cached.
* **RegistryClient**: Talks to **OCI registry** for manifests/blobs using `auth.docker.io/token` with `scope=repository:<repo>:pull`. Includes **multi‑arch resolution** to a platform manifest.
* **Caches**: In‑memory LRU via `lru-cache` (v10) with TTL tiers.
* **Rate limiting**: `p-limit` caps concurrency (env‑configurable).

---

## 4 Tooling Surface (Current)

* `docker_search_images` – Query Hub for repositories.
* `docker_get_image_details` – Repo metadata (stars, pulls, desc, status).
* `docker_list_tags` – Paginated tags with size/digest/updated.
* `docker_get_manifest` – Raw manifest (or index); optional future: resolved variant.
* `docker_analyze_layers` – Resolves multi‑arch → layers list & total size.
* `docker_compare_images` – Compares two manifests’ layer sets & sizes.
* `docker_get_dockerfile` – Best‑effort extraction from config history.
* `docker_get_stats` – Stars, pulls, last updated.
* `ping` – Minimal echo tool for MCP handshake testing.

Each tool validates input via Zod and returns compact, JSON‑serializable results.

---

## 5 Caching Strategy

* **LRU tiers** (configurable TTL via env):

  * `short` (e.g., 60s): searches, bearer tokens, registry tokens, manifests.
  * `medium` (e.g., 10m): repo details, tag listings.
  * `long` (e.g., 1h): not used yet; reserved for hot repos in future.
* **Memo wrapper** ensures single flight per key and avoids thundering herds.
* **Invalidation**: TTL based; severe HTTP errors bypass cache; transient errors don’t poison cache.

---

## 6 Rate Limits & Concurrency

* **Concurrency cap** with `p-limit` (default 6, tuned via `MAX_CONCURRENCY`).
* **Pagination** for list endpoints; tool inputs expose page/pageSize.
* **Back‑pressure**: rely on TTL caching + limited parallelism. Future: exponential backoff when 429 is detected.

---

## 7 Configuration Reference

Environment variables (see `.env.example`):

* `DOCKERHUB_USERNAME` (required for authenticated mode)
* `DOCKERHUB_PASSWORD` **or** `DOCKERHUB_TOKEN` (PAT) – choose one
* `CACHE_TTL_SHORT` / `CACHE_TTL_MEDIUM` / `CACHE_TTL_LONG` (seconds)
* `MAX_CONCURRENCY` (integer)

---


## 8  MCP server congiguration for Cline 

### Local Configuration
```json
{
  "mcpServers": {
    "dockerhub": {
      "command": "node",
      "args": ["/absolute_path/dockerhub-mcp-server/dist/index.js"],
      "env": {
        "DOCKERHUB_USERNAME": "",
        "DOCKERHUB_TOKEN": "",
        "DOCKERHUB_PASSWORD":""
      },
      "disabled": false
    }
  }
}
```
### Docker Configuration

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
---

## 9 Example I/O (copy‑paste)

**Search**

```json
{
  "query": "python",
  "page": 1,
  "pageSize": 5
}
```

**Repo details**

```json
{ "repository": "library/python" }
```

**Analyze layers (resolved)**

```json
{
  "repository": "library/ubuntu",
  "reference": "22.04",
  "platform": { "os": "linux", "architecture": "amd64" }
}
```

**Compare**

```json
{
  "a": { "repository": "library/python", "reference": "3.12", "platform": { "os": "linux", "architecture": "amd64" } },
  "b": { "repository": "library/python", "reference": "3.11", "platform": { "os": "linux", "architecture": "amd64" } }
}
```

---

**Authoring Notes**

* ESM first, NodeNext resolution, `.js` import specifiers in source for build/runtime parity.
* Strict Zod typing via generic tool helper; raw‑shape compatibility with current MCP SDK types.
* All examples verified via MCP Inspector and Cline.
