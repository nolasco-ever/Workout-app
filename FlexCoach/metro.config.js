const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // @react-spring/native's ESM build (selected via package "exports") wraps
    // `require` in a Node-only shim that calls Metro's require by module name,
    // which throws `Unknown named module: "react-native"` at runtime.
    // Force Metro to use the CommonJS build instead.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@react-spring/native') {
        return context.resolveRequest(
          context,
          '@react-spring/native/dist/cjs/index.js',
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
