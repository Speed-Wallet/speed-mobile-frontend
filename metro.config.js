const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    // when importing crypto, resolve to react-native-quick-crypto
    return context.resolveRequest(
      context,
      'react-native-quick-crypto',
      platform,
    );
  }

  // Suppress warnings for known packages with incomplete exports
  const suppressWarnings = ['rpc-websockets', '@noble/hashes/crypto.js'];

  if (suppressWarnings.some((pkg) => moduleName.includes(pkg))) {
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      // Fallback to file-based resolution without warning
      return context.resolveRequest(context, moduleName, platform);
    }
  }

  // otherwise chain to the standard Metro resolver.
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules.crypto = require.resolve(
  'react-native-get-random-values',
);

module.exports = config;
