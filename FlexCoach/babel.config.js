module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 runs on react-native-worklets; its plugin must be last.
  plugins: ['react-native-worklets/plugin'],
};
