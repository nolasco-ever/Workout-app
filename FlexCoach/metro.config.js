const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaults = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // 3D badge models (react-native-filament loads them with require()).
    assetExts: [...defaults.resolver.assetExts, 'glb'],
  },
};

module.exports = mergeConfig(defaults, config);
