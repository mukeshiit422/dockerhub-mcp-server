import { z } from "zod";
import { tool } from "../mcp.js";

export default function register(server: any) {
  tool(
    server,
    "ping",
    z.object({ message: z.string().default("hello") }),
    async ({ message }) => ({ pong: message, ok: true, now: new Date().toISOString() })
  );
}
