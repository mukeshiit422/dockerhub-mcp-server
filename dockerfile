# Simple, dev-friendly image
FROM node:20-alpine

WORKDIR /app
# install pnpm
RUN corepack enable

# Install deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Build TS -> JS
COPY tsconfig*.json ./
COPY src ./src
RUN pnpm build

# Runtime
ENV NODE_ENV=production
# logs must go to stderr for MCP (stdio)
CMD ["node", "dist/index.js"]
 