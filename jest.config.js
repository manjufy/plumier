module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: false,
  verbose: false,
  collectCoverage: true,
  collectCoverageFrom: [
    "packages/*/src/**/*"
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  rootDir: ".",
  moduleNameMapper: {
    "@plumier/(.*)": "<rootDir>packages/$1/src",
    "^plumier$": "<rootDir>packages/plumier/src/index.ts",
    "^tinspector$": "<rootDir>packages/tinspector/src/index.ts",
    "^typedconverter$": "<rootDir>packages/typedconverter/src/index.ts",
  },
  snapshotSerializers: [
    "<rootDir>script/function-snapshot-serializer.js",
    "<rootDir>script/mongodb-id-snapshot-serializer.js",
    "<rootDir>script/date-snapshot-serializer.js"
  ],
  globals: {
      'ts-jest': {
          tsConfig: '<rootDir>tests/tsconfig.json'
      }
  }
};