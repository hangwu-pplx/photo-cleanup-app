module.exports = {
  SafeAreaProvider: jest.fn(({ children }) => children),
  SafeAreaView: jest.fn(({ children }) => children),
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
};
