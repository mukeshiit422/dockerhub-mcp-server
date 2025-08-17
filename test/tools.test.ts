import { describe, it, expect } from "@jest/globals";
import { compareManifests } from "../src/dockerhub/parsers.js";

describe("compareManifests", () => {
  it("computes set differences", () => {
    const a: any = { layers: [{ digest: "A" }, { digest: "B" }] };
    const b: any = { layers: [{ digest: "B" }, { digest: "C" }] };
    const { onlyA, onlyB, common } = compareManifests(a, b);
    expect(onlyA).toEqual(["A"]);
    expect(onlyB).toEqual(["C"]);
    expect(common).toEqual(["B"]);
  });
});