module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Two worklet runtimes, two Babel plugins, and each 'worklet' function must be
  // transformed by exactly one of them: react-native-filament runs on
  // react-native-worklets-core, everything else (Reanimated 4) on react-native-worklets.
  overrides: [
    { test: /node_modules[\\/]react-native-(filament|worklets-core)[\\/]/, plugins: ['react-native-worklets-core/plugin'] },
    { exclude: /node_modules[\\/]react-native-(filament|worklets-core)[\\/]/, plugins: ['react-native-worklets/plugin'] },
  ],
};
