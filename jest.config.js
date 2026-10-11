// eslint-disable-next-line no-undef
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^react-native/setup-env$': '<rootDir>/jest.setup-env.js',
    '^firebase/(.*)$': '<rootDir>/jest.firebase-mock.js',
    '^firebase$': '<rootDir>/jest.firebase-mock.js',
  },
};
