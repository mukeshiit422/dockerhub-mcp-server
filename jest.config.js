/** @type {import('jest').Config} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],

    // Compile TS in ESM mode
    transform: {
      '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: true }]
    },

    // Tell Jest that .ts files are ESM
    extensionsToTreatAsEsm: ['.ts'],

    // Our source imports like "./mcp.js" should resolve to TS during tests
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1'
    }
  };

 