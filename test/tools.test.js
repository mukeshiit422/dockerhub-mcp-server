import { compareManifests } from "../src/dockerhub/parsers.js";
describe("compareManifests", () => {
    it("computes set differences", () => {
        const a = { layers: [{ digest: "A" }, { digest: "B" }] };
        const b = { layers: [{ digest: "B" }, { digest: "C" }] };
        const { onlyA, onlyB, common } = compareManifests(a, b);
        expect(onlyA).toEqual(["A"]);
        expect(onlyB).toEqual(["C"]);
        expect(common).toEqual(["B"]);
    });
});
