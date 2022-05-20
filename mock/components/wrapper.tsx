import * as React from 'react';

import { ApiHooksStore } from '../../src/core/store';

export const Wrapper: React.FC<React.PropsWithChildren<{ testKeys: ApiHooksStore.TestKeyState }>> = ({ children, testKeys }) => {
  return <ApiHooksStore.Provider testKeys={testKeys}>{children}</ApiHooksStore.Provider>;
};
