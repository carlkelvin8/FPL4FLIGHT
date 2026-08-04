// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Resolve @pilotforms/shared to local inlined copy (for EAS builds)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@pilotforms/shared": path.resolve(projectRoot, "src/shared-pkg"),
};

// 5. Add PDF to asset extensions so bundled PDFs are included in the build
config.resolver.assetExts = [...(config.resolver.assetExts || []), "pdf"];

module.exports = config;
