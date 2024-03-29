import { ApiHooks } from './apiHooks';
import { ApiHooksStore } from './store';

export namespace EndpointIDs {
  /** general utility type - represents a function  */
  type AnyFunction = (param: any) => any;

  /** CREATION TYPES */

  /** The root type of the endpointIDs object, represents a dictionary of controllers */
  export type ControllerMethodsMulti<TApiClientDictionary> = {
    [TClientKey in keyof TApiClientDictionary]: ControllerMethods<TApiClientDictionary[TClientKey]>;
  };

  /** The root type of the endpointIDs object, represents a dictionary of controllers */
  export type ControllerMethods<TApiClient> = { [TControllerKey in keyof TApiClient]: EndpointMethods<TApiClient[TControllerKey]> };

  /** The type of the endpointID factory - receives optional caching config an returns a response object which can be used to identify this endpoint within global state */
  export type EndpointIDFactory<TParam> = <TMutationParam>(config?: Config<TMutationParam, TParam>) => Response<TMutationParam>;

  /** The type applying the endpointID factory method to each controller endpoint. */
  export type EndpointMethods<TApiController> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? EndpointIDFactory<ApiHooks.FirstParamOf<TApiController[TEndpointKey]>>
      : never;
  };

  /** CACHE IDENTIFIER TYPES */

  /**
   * The config passed to the EndpointID factory method.
   */
  export interface Config<TMutationParam, TParam> {
    /**
     * (optional) The value used to cache data against. Allows a specific state slice to be identified within an endpoint's cache, overrides cacheKeyFromMutationParam
     */
    cacheKeyValue?: string | number;
    /**
     * (optional) Allows the above cacheKeyValue to be derived from the parameter of a mutation.
     */
    cacheKeyFromMutationParam?: ApiHooks.CacheKey<TMutationParam>;
    /**
     * (optional) By default, a refetch query will send the last parameters used, if you need to intercept that though you can do it here, these params will be used instead
     */
    paramOverride?: Partial<TParam>;
    /**
     * (optional) How should the `paramOverride` behave?
     * - `replace` will send ONLY the params in `paramOverride`.
     * - `merge` will deep merge the params in `paramOverride` with those sent with the last query request.
     * @default merge
     */
    paramOverrideMode?: ApiHooksStore.RefetchParamOverrideMode;
  }

  /**
   * The response returned by EndpointID factory method.
   * Contains everything passed into config as well as it's own properties
   */
  export interface Response<TMutationParam> extends Config<TMutationParam, any> {
    /**
     * The string used to identify the endpoint in global state.
     */
    endpointHash: string;
  }

  /**
   * The create function takes an API client and returns a dictionary of endpoint identifiers to be used for declaring refetch queries and for testing.
   * @param apiClient The API client to parse, must be an object containing controller objects with nested endpoint functions
   * @returns A dictionary of endpoint identifiers to be used for declaring refetch queries and for testing.
   */
  export function create<TApiClient extends object = any>(apiClient: TApiClient): ControllerMethods<TApiClient> {
    // Reduce client controller dictionary into endpoint ID functions
    return Object.keys(apiClient).reduce<ControllerMethods<TApiClient>>((memo, controllerKey) => {
      const newMemo = { ...memo };
      const controller = apiClient[controllerKey];
      newMemo[controllerKey] = Object.keys(controller).reduce<EndpointMethods<any>>((incomingControllerDictionary, endpointKey) => {
        // A string unique to the endpoint - combines the controller and endpoint names
        const endpointHash = `${controllerKey}.${endpointKey}`;
        const controllerDictionary = { ...incomingControllerDictionary };
        controllerDictionary[endpointKey] = (config: Config<any, any> | undefined): Response<any> => {
          return { endpointHash, ...(config ?? {}) };
        };
        return controllerDictionary;
      }, {} as EndpointMethods<any>);
      return newMemo;
    }, {} as ControllerMethods<TApiClient>);
  }

  /**
   * The create function takes a dictionary of API clients and returns a dictionary of endpoint identifiers to be used for declaring refetch queries and for testing.
   * @param apiClientDictionary A dictionary of API clients to parse, must be an object containing client key strings mapped to clients containing controller objects with nested endpoint functions
   * @returns A dictionary of endpoint identifiers to be used for declaring refetch queries and for testing.
   */
  export function createMulti<TApiClientDictionary extends object = any>(
    apiClientDictionary: TApiClientDictionary
  ): ControllerMethodsMulti<TApiClientDictionary> {
    return Object.keys(apiClientDictionary).reduce<ControllerMethodsMulti<TApiClientDictionary>>((memo, clientKey) => {
      const newMemo = { ...memo };
      const client = apiClientDictionary[clientKey];
      newMemo[clientKey] = create(client);
      return newMemo;
    }, {} as ControllerMethodsMulti<TApiClientDictionary>);
  }
}
