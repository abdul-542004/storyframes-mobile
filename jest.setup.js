/* eslint-disable no-undef */
// Jest setup file for StoryFrames Expo tests

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  class MockFile {
    constructor(parent, name) {
      this.uri = `file:///mock/documents/${name}`;
    }
    write = jest.fn().mockResolvedValue(undefined);
  }

  return {
    File: MockFile,
    Paths: {
      document: { uri: 'file:///mock/documents/' },
      cache: { uri: 'file:///mock/cache/' },
    },
    cacheDirectory: 'file:///mock/cache/',
    documentDirectory: 'file:///mock/documents/',
    EncodingType: {
      Base64: 'base64',
      UTF8: 'utf8',
    },
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
    writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
    readAsStringAsync: jest.fn().mockResolvedValue('mock-content'),
    deleteAsync: jest.fn().mockResolvedValue(undefined),
    makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    withTransactionAsync: jest.fn(async (callback) => callback(mockDb)),
  };
  return {
    openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
  };
});

// Mock @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    Path: {
      Make: jest.fn().mockReturnValue({
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        quadTo: jest.fn(),
        reset: jest.fn(),
      }),
    },
  },
  Canvas: 'Canvas',
  Path: 'Path',
  Paint: 'Paint',
}));
