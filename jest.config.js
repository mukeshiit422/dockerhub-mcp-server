export default {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] }
  };