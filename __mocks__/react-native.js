module.exports = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Alert: { alert: jest.fn() },
  StyleSheet: {
    create: (styles) => styles,
  },
};
