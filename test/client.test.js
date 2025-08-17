import { estimatePullSize } from "../src/dockerhub/parsers.js";
describe("parsers", () => {
    it("estimates pull size", () => {
        const size = estimatePullSize({ schemaVersion: 2, layers: [{ size: 10 }, { size: 5 }] });
        expect(size).toBe(15);
    });
});
