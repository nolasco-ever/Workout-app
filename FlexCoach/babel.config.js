module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 runs on react-native-worklets; its plugin must be last.
  // react-native-filament runs on react-native-worklets-core; its plugin goes first, before Reanimated's.
  plugins: ['react-native-worklets-core/plugin', 'react-native-worklets/plugin'],
};
