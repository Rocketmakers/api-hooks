import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';

import { ApiHooksStore } from '../src/core/store';
import { Wrapper } from '../mock/components/wrapper';
import { apiHooks, endpointIds } from '../mock/state/apiHooks';

const useTestKeysTest = () => {
  const [{ data }] = apiHooks.user.getUserList.useQuery();
  return data?.[0]?.id;
};

it('Mock endpoint should receive test key correctly', async () => {
  const testKey = 'test-keys-test';

  const testKeys: ApiHooksStore.TestKeyState = {
    [endpointIds.user.getUserList().endpointHash]: { testKey },
  };

  const { result, waitForValueToChange } = renderHook(() => useTestKeysTest(), {
    wrapper: ({ children }: React.PropsWithChildren) => <Wrapper testKeys={testKeys}>{children}</Wrapper>,
  });

  await waitForValueToChange(() => result.current);

  expect(result.current).toEqual(testKey);
});
