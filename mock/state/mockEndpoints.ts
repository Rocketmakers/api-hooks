import { ApiHooks } from '../../src/index';
import { apiClient } from '../api/apiClient';

export const mockEndpointFactory: ApiHooks.MockEndpointLibraryFactory<typeof apiClient> = (emptyMap) => {
  const endpointMap = { ...emptyMap };

  endpointMap.user.getUserList = async (params, testKey) => {
    switch (testKey) {
      case 'test-keys-test':
        return [
          {
            id: testKey,
            firstName: 'Mickey',
            lastName: 'Horse',
            email: 'mickey@horse.com',
          },
        ];
      default:
        return [];
    }
  };

  return endpointMap;
};
