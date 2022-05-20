module.exports = {
  stories: ['../../stories/**/*.stories.mdx', '../../stories/**/*.stories.@(js|jsx|ts|tsx)', '../../docs/**/*.stories.mdx'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-vite',
  },
  features: {
    interactionsDebugger: true,
  },
  async viteFinal(config, { configType }) {
    config.resolve.alias = {
      '~@rocketmakers': './node_modules/@rocketmakers',
    };
    config.css = {};
    config.css.modules = {
      localsConvention: 'dashesOnly',
    };
    return config;
  },
};
