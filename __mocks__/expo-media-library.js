module.exports = {
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getAssetsAsync: jest.fn(() => Promise.resolve({ assets: [], hasNextPage: false })),
  deleteAssetsAsync: jest.fn(() => Promise.resolve(true)),
  SortBy: { creationTime: 'creationTime' },
  MediaType: { photo: 'photo' },
};
