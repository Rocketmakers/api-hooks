import { ApiHooks } from '../../src';
import { EndpointIDs } from '../../src/core/endpointIDs';
import { apiClient } from '../api/apiClient';
import { mockEndpointFactory } from './mockEndpoints';

export const apiHooks = ApiHooks.create(apiClient, {
  mockEndpointFactory,
});

export const endpointIds = EndpointIDs.create(apiClient);
