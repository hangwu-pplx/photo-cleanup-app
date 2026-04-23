module.exports = {
  cacheDirectory: '/mock/cache/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  deleteAsync: jest.fn(() => Promise.resolve()),
};
