// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules needed by Supabase and other libraries
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('react-native-crypto'),
  http: require.resolve('@tradle/react-native-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('react-native-os'),
  path: require.resolve('path-browserify'),
  fs: require.resolve('react-native-level-fs'),
  net: require.resolve('react-native-tcp'),
  tls: require.resolve('react-native-tcp'),
  zlib: require.resolve('browserify-zlib'),
  url: require.resolve('url'),
  assert: require.resolve('assert'),
  'react-native-randombytes': require.resolve('react-native-randombytes')
};

module.exports = config;
