import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createServer() {
  return new McpServer({ name: "dockerhub-mcp-server", version: "0.1.0" });
}

// Extract ZodRawShape from a z.object(...)
function toRawShape(schema: z.AnyZodObject): z.ZodRawShape {
  const def: any = (schema as any)?._def;
  if (def?.shape) return def.shape() as z.ZodRawShape; // zod v3 common path
  if ((schema as any)?.shape) return (schema as any).shape as z.ZodRawShape; // fallback
  throw new Error("tool(): expected a z.object(...) schema");
}

/**
 * Register a tool with full type inference from a Zod object schema.
 * - `input` must be a z.object({...})
 * - `handler` gets strongly typed args (z.infer<S>)
 */
export function tool<S extends z.AnyZodObject, O>(
  server: McpServer,
  name: string,
  input: S,
  handler: (args: z.infer<S>) => Promise<O>
) {
  const rawShape = toRawShape(input);

  server.registerTool(
    name,
    {
      title: name,
      description: name,
      // Older SDKs expect a ZodRawShape here (not a full ZodObject)
      inputSchema: rawShape
    },
    async (raw: unknown) => {
      // Still do full validation with the original schema
      const args = input.parse(raw) as z.infer<S>;
      const data = await handler(args);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
      };
    }
  );
}
