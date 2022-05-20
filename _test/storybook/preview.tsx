import React from 'react';
import { ApiHooksStore } from '../../src';

import '../../mock/theme/theme.scss';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (Story) => (
    <ApiHooksStore.Provider>
      <Story />
    </ApiHooksStore.Provider>
  ),
];
