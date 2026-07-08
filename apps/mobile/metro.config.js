const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Resolve from mobile's node_modules first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force critical packages to ALWAYS resolve from mobile's node_modules
//    This prevents React 18 (admin/Next.js) from being used instead of React 19 (mobile/RN 0.81)
const forcedModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react/jsx-runtime": path.resolve(projectRoot, "node_modules/react/jsx-runtime"),
  "react/jsx-dev-runtime": path.resolve(projectRoot, "node_modules/react/jsx-dev-runtime"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If someone requires 'react' or 'react-dom', always use mobile's version
  if (forcedModules[moduleName]) {
    return {
      filePath: require.resolve(forcedModules[moduleName]),
      type: "sourceFile",
    };
  }

  // For bare 'react' imports from any package (even deep in node_modules)
  if (moduleName === "react" || moduleName === "react-dom") {
    return {
      filePath: require.resolve(
        path.resolve(projectRoot, "node_modules", moduleName)
      ),
      type: "sourceFile",
    };
  }

  // Default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
