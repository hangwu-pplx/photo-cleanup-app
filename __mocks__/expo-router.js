module.exports = {
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: {
    Screen: jest.fn(() => null),
  },
};
