// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Define Node.js core modules to ignore, plus 'ws'
const modulesToIgnore = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  // 'console', // console is often polyfilled or available
  'constants',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'http2',
  'inspector',
  // 'module', // 'module' might be needed by some bundler features if not careful
  'net',
  'os',
  'path',
  'perf_hooks',
  // 'process', // process is usually polyfilled by React Native
  'punycode',
  'querystring',
  'readline',
  'repl',
  'string_decoder',
  // 'sys', // deprecated
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  // 'v8', // v8 specific, unlikely to be used directly by RN app deps
  'vm',
  'worker_threads',
  'zlib',
  'ws', // Add 'ws' as per the previous error
];

const extraNodeModules = {};
modulesToIgnore.forEach(modName => {
  extraNodeModules[modName] = false;
});

// Explicitly point 'stream' to the empty module
extraNodeModules.stream = path.resolve(__dirname, 'empty-module.js');
// Explicitly point 'crypto' to the empty module
extraNodeModules.crypto = path.resolve(__dirname, 'empty-module.js');

config.resolver = {
  ...config.resolver,
  extraNodeModules,
};

module.exports = config;
