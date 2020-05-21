module.exports = {
  roots: ["<rootDir>/src"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  collectCoverageFrom: ["src/**/*.ts"],
  testMatch: ["**/__tests__/**/*.(spec|test).(ts|js)"],
  testEnvironment: "node",
  clearMocks: true,
  coverageDirectory: "coverage"
};
