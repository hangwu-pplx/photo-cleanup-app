module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        baseUrl: '.',
        paths: {
          '*': ['*'],
        },
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^expo(.*)$': '<rootDir>/__mocks__/expo$1.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native-safe-area-context.js',
  },
  collectCoverageFrom: [
    'domain/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!domain/**/types.ts',
  ],
};
