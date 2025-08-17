import { describe, it, expect } from "@jest/globals";
import { estimatePullSize } from "../src/dockerhub/parsers.js";

describe("parsers", () => {
  it("estimates pull size", () => {
    const size = estimatePullSize({ schemaVersion: 2, layers: [{ size: 10 }, { size: 5 }] } as any);
    expect(size).toBe(15);
  });
});