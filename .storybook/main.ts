import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook is documentation-only: it lives in the repo, never in the published
 * bundle. `package.json#files` limits the tarball to `dist`, and the stories sit
 * outside `src` so neither the Vite lib build nor `vite-plugin-dts` sees them.
 */
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    // Read prop tables straight from the source JSDoc rather than from dist.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },
  viteFinal: async (config) => {
    // The lib build injects `vite-plugin-dts`, which would try to emit types for
    // stories. Storybook gets a clean config instead.
    config.plugins = (config.plugins ?? []).filter((plugin) => {
      const name = plugin && 'name' in plugin ? plugin.name : ''
      return name !== 'vite:dts'
    })
    return config
  },
}

export default config
