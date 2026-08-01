import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(color|Color)$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Getting Started',
          'Components',
          ['Provider', 'Pool', 'LiquidPool', 'Diamond'],
          'Hooks',
          'Recipes',
        ],
      },
    },
    docs: {
      codePanel: true,
    },
  },
  tags: ['autodocs'],
}

export default preview
