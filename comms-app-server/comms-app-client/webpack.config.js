const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "util": require.resolve("util/"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "events": require.resolve("events/"), // Polyfill for events
      "fs": false, // If you are not using Node.js file system, set to false
      "path": require.resolve("path-browserify"), // Polyfill for path
      "os": require.resolve("os-browserify"), // Polyfill for os
      "http": require.resolve("stream-http"), // Polyfill for http
      "https": require.resolve("https-browserify"), // Polyfill for https
      "querystring": require.resolve("querystring-es3"), // Polyfill for querystring
    },
  },
};
