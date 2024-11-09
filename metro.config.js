const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Define paths to block within `node_modules`
const blockListPatterns = [
  /node_modules\/.*\/__tests__\/.*/,         // Exclude test files
  /node_modules\/.*\/examples\/.*/,          // Exclude example files
  /node_modules\/.*\/docs\/.*/,              // Exclude documentation files
  /node_modules\/.*\/demo\/.*/,              // Exclude demo files
  /node_modules\/.*\/samples\/.*/,           // Exclude sample files
  /node_modules\/react-native\/node_modules\/.*/, // Avoid duplicate RN dependencies
];

// Metro configuration
module.exports = {
  ...defaultConfig,
  watchFolders: [
    __dirname // Only watch the project root
  ],
  resolver: {
    ...defaultConfig.resolver,
    blockList: blockListPatterns,
  },
};












// const { getDefaultConfig } = require('expo/metro-config');

// const defaultConfig = getDefaultConfig(__dirname);

// // Limit watch folders to only necessary directories
// defaultConfig.watchFolders = [
//   __dirname // Only watch the project root
// ];

// // Refine the blockList (formerly blacklistRE) to exclude non-essential files in `node_modules`
// defaultConfig.resolver = {
//   ...defaultConfig.resolver,
//   blockList: [
//     /node_modules\/.*\/__tests__\/.*/,       // Ignore test files
//     /node_modules\/.*\/examples\/.*/,        // Ignore example files
//     /node_modules\/.*\/docs\/.*/,            // Ignore documentation
//     /node_modules\/react-native\/node_modules\/.*/, // Avoid duplicate React Native instances
//   ],
// };

// module.exports = defaultConfig;





// const { getDefaultConfig } = require('expo/metro-config');
// const defaultConfig = getDefaultConfig(__dirname);
// module.exports = defaultConfig;








// const { getDefaultConfig } = require('expo/metro-config');

// const defaultConfig = getDefaultConfig(__dirname);
// // Limit watch folders to only necessary directories
// defaultConfig.watchFolders = [
//   __dirname // Only add the root project directory
// ];
// // Exclude node_modules from being watched (if needed)
// defaultConfig.resolver = {
//   ...defaultConfig.resolver,
//   blacklistRE: /node_modules\/.*/
// };

// module.exports = defaultConfig;




