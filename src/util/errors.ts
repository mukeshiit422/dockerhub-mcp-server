export class HttpError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = "HttpError";
    }
  }
  
  export function toUserMessage(e: unknown): string {
    if (typeof e === "object" && e && "message" in e) return String((e as any).message);
    return "Unknown error";
  }