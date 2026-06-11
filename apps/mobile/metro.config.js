const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Resolve packages from monorepo root first (hoisted deps)
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
]

// CRITICAL: Enable symlink support for pnpm
config.resolver.unstable_enableSymlinks = true

// Use nodeModulesPaths order instead of hierarchical lookup
config.resolver.disableHierarchicalLookup = true

module.exports = config
