import * as React from 'react';
import { ApiHooksCaching } from './caching';
import { ApiHooksStore } from './store';
import { ApiHooksSystemSettings } from './systemSettings';
import { ApiHooksGlobal } from './global';
import { EndpointIDs } from './endpointIDs';

/**
 * API Hooks
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains everything relating to the hooks themselves, includes:
 * - The hook creation entry point
 * - The useQuery and useMutation hooks
 * - The creation of the empty mock endpoint + default settings dictionaries
 */
export namespace ApiHooks {
  /** UTILITY TYPES */

  /** general utility type - represents a function  */
  type AnyFunction = (param: any) => any;

  /** general utility type - gets the type of a promise result from a promise */
  type PromiseResult<TPromise> = TPromise extends Promise<infer TResult> ? TResult : never;

  /** general utility type - gets the type of the first parameter in a function */
  type FirstParamOf<TFunc extends AnyFunction> = Parameters<TFunc>[0];

  /** general utility type - differentiates between the three types of hook that can be used for an endpoint */
  type HookType = 'query' | 'mutation' | 'request';

  /** CLIENT CREATION TYPES */

  /** The type for the factory function that creates the hook config library for "multi" mode (multiple API clients) */
  export type HookConfigLibraryFactoryMulti<TApiClientDictionary> = (
    emptyLibrary: HookConfigControllerLibraryMulti<TApiClientDictionary>
  ) => HookConfigControllerLibraryMulti<TApiClientDictionary>;

  /** The type for the factory function that creates the hook config library */
  export type HookConfigLibraryFactory<TApiClient> = (
    emptyLibrary: HookConfigControllerLibrary<TApiClient>
  ) => HookConfigControllerLibrary<TApiClient>;

  /** The type for the factory function that creates the mock endpoint library for "multi" mode (multiple API clients) */
  export type MockEndpointLibraryFactoryMulti<TApiClientDictionary> = (
    emptyLibrary: MockEndpointControllerLibraryMulti<TApiClientDictionary>
  ) => MockEndpointControllerLibraryMulti<TApiClientDictionary>;

  /** The type for the factory function that creates the mock endpoint library */
  export type MockEndpointLibraryFactory<TApiClient> = (
    emptyLibrary: MockEndpointControllerLibrary<TApiClient>
  ) => MockEndpointControllerLibrary<TApiClient>;

  /** The type for the factory function that creates the default data library for "multi" mode (multiple API clients) */
  export type DefaultDataLibraryFactoryMulti<TApiClientDictionary> = (
    emptyLibrary: DefaultDataControllerLibraryMulti<TApiClientDictionary>
  ) => DefaultDataControllerLibraryMulti<TApiClientDictionary>;

  /** The type for the factory function that creates the default data library */
  export type DefaultDataLibraryFactory<TApiClient> = (
    emptyLibrary: DefaultDataControllerLibrary<TApiClient>
  ) => DefaultDataControllerLibrary<TApiClient>;

  /** The root type of the apiHooks "multi" object, represents a dictionary of api clients */
  export type ControllerHooksMulti<TApiClientDictionary, TProcessingResponse> = {
    [TClientKey in keyof TApiClientDictionary]: ControllerHooks<TApiClientDictionary[TClientKey], TProcessingResponse>;
  };

  /** The root type of the apiHooks object, represents a dictionary of controllers */
  export type ControllerHooks<TApiClient, TProcessingResponse> = {
    [TControllerKey in keyof TApiClient]: EndpointHooks<TApiClient[TControllerKey], TProcessingResponse>;
  };

  /** The root type of the hookConfig "multi" object, represents a dictionary of api clients */
  export type HookConfigControllerLibraryMulti<TApiClientDictionary> = {
    [TClientKey in keyof TApiClientDictionary]: HookConfigControllerLibrary<TApiClientDictionary[TClientKey]>;
  };

  /** The root type of the hookConfig object, represents a dictionary of controllers */
  export type HookConfigControllerLibrary<TApiClient> = { [TControllerKey in keyof TApiClient]: HookEndpointConfig<TApiClient[TControllerKey]> };

  /** The root type of the mockEndpoint "multi" object, represents a dictionary of api clients */
  export type MockEndpointControllerLibraryMulti<TApiClientDictionary> = {
    [TClientKey in keyof TApiClientDictionary]: MockEndpointControllerLibrary<TApiClientDictionary[TClientKey]>;
  };

  /** The root type of the mockEndpoints object, represents a dictionary of controllers */
  export type MockEndpointControllerLibrary<TApiClient> = { [TControllerKey in keyof TApiClient]: MockEndpointLibrary<TApiClient[TControllerKey]> };

  /** The root type of the defaultData "multi" object, represents a dictionary of api clients */
  export type DefaultDataControllerLibraryMulti<TApiClientDictionary> = {
    [TClientKey in keyof TApiClientDictionary]: DefaultDataControllerLibrary<TApiClientDictionary[TClientKey]>;
  };

  /** The root type of the defaultData object, represents a dictionary of controllers */
  export type DefaultDataControllerLibrary<TApiClient> = { [TControllerKey in keyof TApiClient]: DefaultDataLibrary<TApiClient[TControllerKey]> };

  /**
   * Adds the three hooks to each endpoint within a controller (if it's a function within a controller, it's an endpoint)
   * @param useQuery The hook to be used if the endpoint is a GET and should interface with the caching system
   * @param useMutation The hook to be used if the endpoint is a POST/PUT/DELETE and we just need a fetcher and sone live, local state. without any caching.
   * @param useRequest The hook to be used for any request when we ONLY want the basic promise constructor, with no local state and no caching at all.
   */
  export type EndpointHooks<TApiController, TProcessingResponse> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? {
          useQuery: UseQuery<TApiController[TEndpointKey], TProcessingResponse>;
          useMutation: UseMutation<TApiController[TEndpointKey], TProcessingResponse>;
          useRequest: UseRequest<TApiController[TEndpointKey]>;
        }
      : never;
  };

  /**
   * Adds the mock endpoint constructor to each endpoint within a controller (if it's a function within a controller, it's an endpoint)
   */
  export type MockEndpointLibrary<TApiController> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? (arg: FirstParamOf<TApiController[TEndpointKey]>, testKey: string) => ReturnType<TApiController[TEndpointKey]>
      : never;
  };

  /**
   * Adds the default data constructor to each endpoint within a controller (if it's a function within a controller, it's an endpoint)
   */
  export type DefaultDataLibrary<TApiController> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? (arg: FirstParamOf<TApiController[TEndpointKey]>) => PromiseResult<ReturnType<TApiController[TEndpointKey]>>
      : never;
  };

  /**
   * Adds the config options to each endpoint within a controller (if it's a function within a controller, it's an endpoint)
   * @param query (optional) The query settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level
   * @param mutation (optional) The mutation settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level
   * @param request (optional) The request settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level
   */
  type HookEndpointConfig<TApiController> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? {
          query?: Partial<
            UseQueryConfigSettings<FirstParamOf<TApiController[TEndpointKey]>, PromiseResult<ReturnType<TApiController[TEndpointKey]>>>
          >;
          mutation?: Partial<UseMutationSettings<FirstParamOf<TApiController[TEndpointKey]>>>;
          request?: Partial<UseRequestSettings<FirstParamOf<TApiController[TEndpointKey]>>>;
        }
      : never;
  };

  interface CreatingSettingsBase<TParam> {
    /**
     * The application level query settings, can be overridden at endpoint and hook execution level
     */
    queryConfig?: Partial<UseQueryConfigSettings<TParam, any>>;
    /**
     * The application level mutation settings, can be overridden at endpoint and hook execution level
     */
    mutationConfig?: Partial<UseMutationSettings<TParam>>;
    /**
     * The application level settings for the useRequest hook, can be overridden at endpoint and hook execution level
     */
    requestConfig?: Partial<UseRequestSettings<TParam>>;
    /**
     * The application level general settings, can not be overridden, apply generally at application level
     */
    generalConfig?: GeneralConfig;
  }

  /**
   * Type for the optional processing hook that can be passed to creating settings
   */
  export type ProcessingHook<TProcessingResponse> = <TRawResponse>(
    hookType: HookType,
    data: TRawResponse,
    fetchingMode: FetchingMode,
    settings?: UseQuerySettings<any, any> | UseMutationSettings<any>
  ) => TProcessingResponse;

  /**
   * Type denoting the settings object passed to the create method.
   */
  export interface CreationSettings<TApiClient, TParam, TProcessingResponse> extends CreatingSettingsBase<TParam> {
    /**
     * The factory function that creates the hook config library
     */
    hookConfigFactory?: HookConfigLibraryFactory<TApiClient>;
    /**
     * The factory function that creates the mock endpoint library
     */
    mockEndpointFactory?: MockEndpointLibraryFactory<TApiClient>;
    /**
     * The factory function that creates the default data library
     */
    defaultDataFactory?: DefaultDataLibraryFactory<TApiClient>;
    /**
     * An optional hook for any tasks that need to run on every query/mutation API response.
     * - Useful for processes such as error handling.
     * - Is executed as a hook within the same context as useQuery/useMutation, so can call and use other hooks.
     * @param hookType - Either `query` or `mutation` depending on what type of API Hooks is calling the processing hook.
     * @param data - The response data from the API request
     * @param fetchingMode - Either `not-fetching` | `auto` | `manual` | `refetch` depending on why the data was fetched
     * @param settings - The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     * @returns whatever you like, the returned value will be available, strictly typed, under the `processing` property of the live response returned by `useQuery` and `useMutation`
     */
    processingHook?: ProcessingHook<TProcessingResponse>;
  }

  /**
   * Type denoting the settings object passed to the createMulti method.
   */
  export interface CreationSettingsMulti<TApiClientDictionary, TParam> extends CreatingSettingsBase<TParam> {
    /**
     * The factory function that creates the hook config library
     */
    hookConfigFactory?: HookConfigLibraryFactoryMulti<TApiClientDictionary>;
    /**
     * The factory function that creates the mock endpoint library
     */
    mockEndpointFactory?: MockEndpointLibraryFactoryMulti<TApiClientDictionary>;
    /**
     * The factory function that creates the default data library
     */
    defaultDataFactory?: DefaultDataLibraryFactoryMulti<TApiClientDictionary>;
  }
  export interface GeneralConfig {
    /**
     * Switches on verbose console output for debugging purposes
     */
    debugMode?: boolean;
    /**
     * If true, a warning will be shown in the console when an endpoint is used but no config has been added at endpoint level.
     * This is useful if your application structure involves setting all cache keys and refetch queries at endpoint level, and you don't want to leave anything out.
     */
    showMissingConfigWarnings?: boolean;
  }

  /** LIVE RESPONSE TYPES */

  /**
   * Type declaration for the global fetching mode, passed to the loading action to inform the status
   */
  export type FetchingMode = 'not-fetching' | 'auto' | 'manual' | 'refetch';

  /** The type denoting the live response object returned from both the useQuery and useMutation hooks */
  export type LiveResponse<TCache, TProcessingResponse> = {
    data?: TCache;
    error?: any;
    isFetching: boolean;
    fetchingMode: FetchingMode;
    processed: TProcessingResponse;
  };

  /** CACHE KEY TYPES */

  export type CacheKey<TParam> = keyof TParam | ((param: TParam, context?: any) => string | number);

  /** USE QUERY TYPES */

  /** The type of the useQuery hook, receives execution settings and returns an array containing the live state and a fetch method */
  interface UseQuery<TEndpoint extends AnyFunction, TProcessingResponse> {
    (settings?: Partial<UseQuerySettings<FirstParamOf<TEndpoint>, PromiseResult<ReturnType<TEndpoint>>>>): UseQueryResponse<
      PromiseResult<ReturnType<TEndpoint>>,
      Partial<FirstParamOf<TEndpoint>>,
      TProcessingResponse
    >;
  }

  /**
   * The type denoting the response of the useQuery hook
   * @returns[0] An object containing the live data, error, and fetching bool relating to the API request.
   * @returns[1] A manual fetch method for invoking the request - receives the params, optional settings and returns a promise with some data
   */
  export type UseQueryResponse<TCache, TParam, TProcessingResponse> = [
    LiveResponse<TCache, TProcessingResponse>,
    (param?: TParam, fetchSettings?: UseQueryFetchSettings<TCache>) => void
  ];

  /**
   * The basic query settings used at system, application, endpoint and hook execution level.
   */
  export interface UseQuerySettings<TParam, TResponse> {
    /**
     * Should the request fire when the component mounts? Will only fire if cache is stale - defaults to true at system level
     */
    autoInvoke: boolean;
    /**
     * Should the request re-fire when the params change? - defaults to true at system level
     */
    invokeOnParamChange: boolean;
    /**
     * The caching settings
     */
    caching: Partial<ApiHooksCaching.Settings<TParam>>;
    /**
     * Should the hook use the canned default data on initial render?
     */
    useDefaultData?: boolean;
    /**
     * Should the hook always use the mock endpoint to fetch data, rather than the real endpoint?
     */
    useMockEndpoints?: boolean;
    /**
     * (optional) A different string to use as the cache indexer, rather than the param hash, mostly for paging queries.
     */
    cacheKey?: CacheKey<TParam>;
    /**
     * (optional) Will hold any invocation until the parameter designated as the cacheKey has a non "falsey" value.
     */
    holdInvokeForCacheKeyParam: boolean;
    /**
     * Should manual invocations hit the server by default? Can be over-ridden during a manualInvoke with the `forceNetwork` setting
     */
    forceNetworkOnManualInvoke: boolean;
    /**
     * The parameters to send to the request
     */
    parameters?: TParam;
    /**
     * An optional function to modify the payload stored for this endpoint, receives any stored data as well as the incoming data. Also receives previous params and new params
     */
    payloadModifier?: (prevData: TResponse, newData: TResponse, prevParams: TParam, newParams: TParam) => TResponse;
    /**
     * An optional object containing data to be used on first render, ideal for passing data for server-side rendering. NOTE: This will be ignored if the "default data" feature is in use.
     */
    initialData?: TResponse;
    /**
     * By default, the system will block any request with the same endpoint/cacheKey whilst a request is already in progress. Setting this to true will override that behaviour and allow both requests to fire.
     */
    allowSimultaneousRequests: boolean;
    /**
     * A key to show in the debug logs, most useful at hook level to differentiate between two uses of the same hook when debugging.
     */
    debugKey?: string;
  }

  /**
   * The additional settings used at system, application level only - NOT hook execution
   * @param maxCachingDepth The maximum number of state slices to store (for different params) against this endpoint - defaults to 5 at system level
   */
  export interface UseQueryConfigSettings<TParam, TResponse> extends UseQuerySettings<TParam, TResponse> {
    maxCachingDepth: number;
  }

  /**
   * The settings used by the 'fetch' method (returned as the second item in the array) from the useQuery hook
   */
  export interface UseQueryFetchSettings<TResponse> {
    /**
     * If true - cache status will be ignored and data re-requested from the server. Takes it's default from the `forceNetworkOnManualInvoke` query setting
     */
    forceNetwork?: boolean;
    /**
     * An optional function to modify the payload stored for this endpoint, receives any stored data as well as the incoming data.
     */
    payloadModifier?: (prevData: TResponse, newData: TResponse) => TResponse;
  }

  /** USE MUTATION TYPES */

  /** The type of the useMutation hook, receives execution settings and returns a fetch method and some live response state */
  interface UseMutation<TEndpoint extends AnyFunction, TProcessingResponse> {
    (settings?: Partial<UseMutationSettings<FirstParamOf<TEndpoint>>>): UseMutationResponse<
      PromiseResult<ReturnType<TEndpoint>>,
      Partial<FirstParamOf<TEndpoint>>,
      TProcessingResponse
    >;
  }

  /**
   * The type denoting the response of the useMutation hook. receives the params + settings and returns a promise of the response data, and some live response data from local state NOT global cache
   * NOTE: The params and fetch settings here will override the params sent to the hook execution settings, but any hook execution params will be used if nothing is passed here.
   * @returns:
   * [0] - The fetch method used to send the request, returns a promise.
   * [1] - A simple "live response" object - not stored in global state.
   * [2] - A "refetch"
   */
  type UseMutationResponse<TResponse, TParam, TProcessingResponse> = [
    (param?: TParam, fetchSettings?: Partial<UseMutationSettings<TParam>>) => Promise<TResponse>,
    LiveResponse<TResponse, TProcessingResponse>,
    (refetchQueries: EndpointIDs.Response<TParam>[]) => void
  ];

  /**
   * The basic mutation settings used at system, application, endpoint and hook execution level.
   */
  export interface UseMutationSettings<TParam> {
    /**
     * @default true
     * Should the request throw errors? Or swallow them, allowing them to be handled via the live response object?
     */
    throwErrors: boolean;
    /**
     * Should the hook always use the mock endpoint to fetch data, rather than the real endpoint?
     */
    useMockEndpoints?: boolean;
    /**
     * The parameters of the mutation request can be optionally defined here.
     */
    parameters?: TParam;
    /**
     * A set of endpoint IDs denoting queries to be re-fetched after the mutation has happened.
     */
    refetchQueries?: EndpointIDs.Response<TParam>[];
    /**
     * An optional piece of data to send to endpoint level refetch queries in order to form a cache key.
     */
    refetchQueryContext?: any;
    /**
     * A key to show in the debug logs, most useful at hook level to differentiate between two uses of the same hook when debugging.
     */
    debugKey?: string;
  }

  /** USE REQUEST TYPES */

  /** The type of the useRequest hook, receives execution settings and returns a fetch method detached from state and caching */
  interface UseRequest<TEndpoint extends AnyFunction> {
    (settings?: Partial<UseRequestSettings<Partial<FirstParamOf<TEndpoint>>>>): UseRequestResponse<
      PromiseResult<ReturnType<TEndpoint>>,
      Partial<FirstParamOf<TEndpoint>>
    >;
  }

  /**
   * The basic request settings used at system, application, endpoint and hook execution level.
   */
  export interface UseRequestSettings<TParam> {
    /**
     * The parameters of the request can be optionally defined here.
     */
    parameters?: TParam;
    /**
     * A key to show in the debug logs, most useful at hook level to differentiate between two uses of the same hook when debugging.
     */
    debugKey?: string;
  }

  /**
   * The type denoting the response of the useRequest hook. receives the params + settings and returns a promise of the response data detached from all state and caching.
   * NOTE: The params and fetch settings here will override the params sent to the hook execution settings, but any hook execution params will be used if nothing is passed here.
   */
  type UseRequestResponse<TResponse, TParam> = (param?: TParam, fetchSettings?: Partial<UseRequestSettings<TParam>>) => Promise<TResponse>;

  /** UTILITY FUNCTIONS */

  /**
   * Root logging function for debug mode, just a proxy for the console log for now.
   * @param messages The items to log
   */
  function log(...messages: any[]) {
    // eslint-disable-next-line no-console
    console.log(...messages);
  }

  /**
   * Root warning function for debug mode, just a proxy for the console warn for now.
   * @param messages The items to warn
   */
  function warn(...messages: any[]) {
    // eslint-disable-next-line no-console
    console.warn(...messages);
  }

  /** CREATION FUNCTIONS */

  /**
   * Creates and empty dictionary of config for each endpoint to be populated outside this file at application level
   * @param apiClient The API client to parse and create an entry for each controller, and then another for each endpoint.
   * @returns The empty dictionary ready for populating in `../endpointSettings.ts` and `../mockEndpoints.ts`
   */
  function createEmptyHookLibraryDefaults<TApiClient, TLibrary>(apiClient: TApiClient): TLibrary {
    return Object.keys(apiClient).reduce((controllerMemo, controllerKey) => {
      const newControllerMemo = { ...controllerMemo };
      newControllerMemo[controllerKey] = Object.keys(apiClient[controllerKey]).reduce((endpointMemo, endpointKey) => {
        const newEndpointMemo = { ...endpointMemo };
        newEndpointMemo[endpointKey] = {};
        return newEndpointMemo;
      }, {});
      return newControllerMemo;
    }, {} as TLibrary);
  }

  /**
   * Creates the useQuery and useMutation hooks for each endpoint in a controller
   * @param rootKey A string unique to the controller
   * @param controller The controller object
   * @param rootQuerySettings The query settings - system level with application level applied on top
   * @param rootMutationSettings The mutation settings - system level with application level applied on top
   * @param rootRequestSettings The settings for the useRequest hook - system level with application level applied on top
   * @param hookConfig The dictionary of config - populated in `../endpointSettings.ts`
   * @param mockEndpointLibrary The dictionary of mock endpoints - populated in `../mockEndpoints.ts`
   * @param defaultDataLibrary The dictionary of default data - populated in `../defaultData.ts`
   * @returns The useQuery and useMutation hooks
   */
  function createHooks<TController, TProcessingResponse = undefined>(
    rootKey: string,
    controller: TController,
    rootQuerySettings: UseQueryConfigSettings<any, any>,
    rootMutationSettings: UseMutationSettings<any>,
    rootRequestSettings: UseRequestSettings<any>,
    hookConfig: HookConfigControllerLibrary<TController>,
    mockEndpointLibrary: MockEndpointControllerLibrary<TController>,
    defaultDataLibrary: DefaultDataControllerLibrary<TController>,
    generalConfig?: GeneralConfig,
    processingHook?: ProcessingHook<TProcessingResponse>
  ) {
    // Reduce the controller endpoints to produce an object for each one with the two hooks on it.
    return Object.keys(controller).reduce<EndpointHooks<TController, TProcessingResponse>>((incomingControllerDictionary, endpointKey) => {
      // A string unique to the endpoint - combines the controller and endpoint names
      const endpointHash = `${rootKey}.${endpointKey}`;

      // fetch endpoint level query settings if available and apply on top of the passed in system and application level settings
      const querySettings: Partial<UseQueryConfigSettings<any, any>> = hookConfig[endpointKey]?.query ?? {};
      const combinedQuerySettings = { ...rootQuerySettings, ...querySettings };

      // fetch endpoint level query caching settings if available and apply on top of the passed in system and application level settings
      combinedQuerySettings.caching = { ...rootQuerySettings.caching, ...(querySettings.caching ?? {}) };

      // fetch endpoint level query parameters if available and apply on top of the passed in system and application level settings
      combinedQuerySettings.parameters = { ...(rootQuerySettings.parameters ?? {}), ...(querySettings.parameters ?? {}) };

      // fetch endpoint level mutation settings if available and apply on top of the passed in system and application level settings
      const mutationSettings: Partial<UseMutationSettings<any>> = hookConfig[endpointKey]?.mutation ?? {};
      const combinedMutationSettings = { ...rootMutationSettings, ...mutationSettings };

      // fetch endpoint level mutation refetch queries if available and apply on top of the passed in system and application level settings
      if (mutationSettings.refetchQueries) {
        combinedMutationSettings.refetchQueries = [...(rootMutationSettings.refetchQueries || []), ...mutationSettings.refetchQueries];
      }

      // fetch endpoint level mutation parameters if available and apply on top of the passed in system and application level settings
      combinedMutationSettings.parameters = { ...(rootMutationSettings.parameters ?? {}), ...(mutationSettings.parameters ?? {}) };

      // fetch endpoint level request parameters if available and apply on top of the passed in system and application level settings
      const requestSettings: Partial<UseRequestSettings<any>> = hookConfig[endpointKey]?.request ?? {};
      const combinedRequestSettings = { ...rootRequestSettings, ...requestSettings };

      // create two promise factories - one returns the actual endpoint promise, the other returns the mock endpoint if it's been created
      const promiseFactory = (arg: any) => controller[endpointKey](arg);
      const mockPromiseFactory = mockEndpointLibrary[endpointKey] && ((arg: any, testKey?: string) => mockEndpointLibrary[endpointKey](arg, testKey));

      // store an initial application started date/time
      const applicationStartedTimestamp = Date.now();

      // LOGGER FUNCTIONS

      /**
       * Logs messages from useQuery hooks to the console if in debug mode
       * - includes some data about the controller and endpoint
       * - calls the root logging utility function
       */
      const queryLog = (messages: any[], debugKey?: string) => {
        if (generalConfig?.debugMode) {
          log(`API Hooks Query, Endpoint: ${endpointHash}${debugKey ? ` - ${debugKey}` : ''} -`, ...messages);
        }
      };
      /**
       * Logs messages from useMutation hooks to the console if in debug mode
       * - includes some data about the controller and endpoint
       * - calls the root logging utility function
       */
      const mutationLog = (messages: any[], debugKey?: string) => {
        if (generalConfig?.debugMode) {
          log(`API Hooks Mutation, Endpoint: ${endpointHash}${debugKey ? ` - ${debugKey}` : ''} -`, ...messages);
        }
      };
      /**
       * Logs messages from useRequest hooks to the console if in debug mode
       * - includes some data about the controller and endpoint
       * - calls the root logging utility function
       */
      const requestLog = (messages: any[], debugKey?: string) => {
        if (generalConfig?.debugMode) {
          log(`API Hooks Request, Endpoint: ${endpointHash}${debugKey ? ` - ${debugKey}` : ''} -`, ...messages);
        }
      };

      /**
       * An in memory storage container to avoid showing multiple config warnings for the same endpoint
       */
      const endpointWarningsShown: HookType[] = [];

      /**
       * Called when an endpoint is used with either a query or mutation hook.
       * Used to log a warning if the relevant config is missing.
       * @param type The type of hook that's been used
       */
      const endpointUsed = (type: HookType) => {
        if (
          generalConfig?.showMissingConfigWarnings &&
          !endpointWarningsShown.some((t) => t === type) &&
          ((!Object.keys(querySettings).length && type === 'query') || (!Object.keys(mutationSettings).length && type === 'mutation'))
        ) {
          const configExample = type === 'query' ? 'cache keys' : 'refetch queries';
          warn(
            `API Hooks WARNING! - The endpoint "${endpointHash}" has been used as a ${type} without any ${type} config defined at endpoint level. Do you need to add any config? (i.e. ${configExample})`
          );
          endpointWarningsShown.push(type);
        }
      };

      const controllerDictionary = { ...incomingControllerDictionary };
      controllerDictionary[endpointKey] = {
        /**
         * useQuery
         * - The hook to be used if the endpoint is a GET and should interface with the caching system
         * - Receives the hook execution level settings to override the system, application and hook level.
         * - Returns the live data and an optional fetch method to manually invoke
         * - Can only be used within a React Function Component
         */
        useQuery: (executionSettings: Partial<UseQuerySettings<any, any>> = {}): UseQueryResponse<any, any, any> => {
          /** MARK ENDPOINT AS USED */
          React.useEffect(() => {
            endpointUsed('query');
          }, []);

          /** GATHER DATA AND SETTINGS */

          // listen to the context from the store - this state is updated via the central reducer - see `./store.tsx`
          const [state, dispatch, testKeys] = React.useContext(ApiHooksStore.Context);

          // settings - apply the hook execution settings (if any) to the passed in system, application and endpoint level.
          // NOTE - the JSON.stringify prevents the need for the consumer to memoize the incoming execution settings, it's not ideal, but it's only a small object so it should be ok.
          const settingsFromHook = React.useMemo<UseQueryConfigSettings<any, any>>(() => {
            const settings = { ...combinedQuerySettings, ...executionSettings };
            settings.caching = { ...combinedQuerySettings.caching, ...(executionSettings.caching ?? {}) };
            settings.parameters = { ...combinedQuerySettings.parameters, ...(executionSettings.parameters ?? {}) };
            return settings;
          }, [JSON.stringify(executionSettings)]);

          // cache key - retrieve any cache key value if one exists in the settings
          const cacheKeyValueFromHook = React.useMemo(() => {
            const { cacheKey, parameters } = settingsFromHook;
            return ApiHooksCaching.parseCacheKey(parameters, cacheKey);
          }, [settingsFromHook]);

          // parameters - create a unique string from the parameters used in the request - this allows us to detect whether the params of a request have changed and re-invoke
          const paramHashFromHook = React.useMemo<string>(() => {
            return ApiHooksCaching.hashParams(settingsFromHook.parameters);
          }, [settingsFromHook]);

          // storing the cache key in state means we can update it if the parameters change - either through the hook settings or a manual invoke
          const [cacheKey, setCacheKey] = React.useState<string>(cacheKeyValueFromHook);

          // store the last used fetch settings in a ref so that they can be passed to the processing hook.
          const lastUsedSettings = React.useRef<UseQuerySettings<any, any>>();

          // first render ref - for update effect
          const isFirstRender = React.useRef(true);

          // state - Fetch the state slice from the global state object (if exists) based on the cache key value if passed, or the default cache key
          const storedStateSlice = React.useMemo<ApiHooksStore.StateSlice<any>>(() => {
            const currentStoredStateSlice = state[endpointHash]?.[cacheKey];
            // check for default data settings and use that initially if appropriate.
            if (!currentStoredStateSlice && settingsFromHook.useDefaultData) {
              const defaultDataFactory = defaultDataLibrary[endpointKey];
              if (!defaultDataFactory) {
                throw new Error(
                  `API Hooks error - no default data has been defined for the following query: ${endpointHash}, did you mean to set "useDefaultData" to "true"?`
                );
              }
              const defaultDataValue = defaultDataFactory(settingsFromHook.parameters);
              queryLog([`Using default data`, { defaultData: defaultDataValue }], settingsFromHook.debugKey);
              return {
                paramHash: paramHashFromHook,
                data: defaultDataValue,
                status: 'loaded',
                timestamp: applicationStartedTimestamp,
                shouldRefetchData: false,
              };
            }
            // check for "initialData" passed to hook, and use that on first render
            if (!currentStoredStateSlice && settingsFromHook.initialData) {
              queryLog([`Using initial data`, { initialData: settingsFromHook.initialData }], settingsFromHook.debugKey);
              return {
                paramHash: paramHashFromHook,
                data: settingsFromHook.initialData,
                status: 'loaded',
                timestamp: applicationStartedTimestamp,
                shouldRefetchData: false,
              };
            }
            return currentStoredStateSlice;
          }, [state[endpointHash], cacheKey, settingsFromHook]);

          /**
           * Effect to set default data to state
           */
          React.useLayoutEffect(() => {
            if (storedStateSlice && !state[endpointHash]?.[cacheKey]) {
              // To get here, we must have returned some default data that isn't stored in cache. We need to store it now.
              queryLog([`Storing initial data in cache`, { state: storedStateSlice }], settingsFromHook.debugKey);
              dispatch?.(
                ApiHooksStore.Actions.loaded(
                  endpointHash,
                  storedStateSlice.paramHash,
                  cacheKey,
                  storedStateSlice.data,
                  settingsFromHook?.maxCachingDepth,
                  true
                )
              );
            }
          }, [state[endpointHash], cacheKey, storedStateSlice]);

          /** CACHE READER */

          /**
           * Reads the caching settings and data to ascertain whether the data is valid in it's current state.
           */
          const isCacheValid = React.useMemo<boolean>(() => {
            let valid = false;
            let validOnError = false;
            if (storedStateSlice?.data) {
              // it's safe to cast this out of partial here, as we know the system defaults have been loaded
              const cachingSettings = settingsFromHook.caching as ApiHooksCaching.Settings<any>;
              valid = !ApiHooksCaching.isStale(storedStateSlice, cachingSettings.staleIfOlderThan);
              validOnError = !ApiHooksCaching.isStale(storedStateSlice, cachingSettings.staleOnErrorIfOlderThan);
            }
            queryLog(
              [
                `Cache validity loaded/updated`,
                {
                  settings: settingsFromHook,
                  valid,
                  validOnError,
                },
              ],
              settingsFromHook.debugKey
            );
            if (storedStateSlice?.error) {
              return validOnError;
            }
            return valid;
          }, [storedStateSlice, settingsFromHook]);

          // value - create the data value to return from the state slice
          const valueToReturn = React.useMemo<Omit<UseQueryResponse<any, any, any>[0], 'processed'>>(() => {
            queryLog(
              [
                `Current state loaded/updated`,
                {
                  settings: settingsFromHook,
                  cacheData: storedStateSlice ?? 'none',
                  cacheKey,
                },
              ],
              settingsFromHook.debugKey
            );
            return {
              error: storedStateSlice?.error,
              isFetching:
                storedStateSlice?.status === 'loading-auto' ||
                storedStateSlice?.status === 'loading-manual' ||
                storedStateSlice?.status === 'loading-refetch',
              fetchingMode: ApiHooksStore.fetchingModeFromStateSliceStatus(storedStateSlice?.status),
              data: storedStateSlice?.data,
            };
          }, [storedStateSlice, settingsFromHook]);

          /** FETCHERS AND INVOKERS */

          // fetcher - the fetch method - attempts to retrieve data from server, regardless of caching
          const fetch = React.useCallback<(fetchSettings: typeof settingsFromHook, finalParamHash: string, mode: FetchingMode) => void>(
            async (fetchSettings, finalParamHash, mode = 'auto') => {
              // get the new cache key if applicable, and set it to state, thus potentially updating the state slice returned from the hook.
              const finalCacheKey = ApiHooksCaching.parseCacheKey(fetchSettings.parameters, fetchSettings.cacheKey);
              setCacheKey(finalCacheKey);

              // check the global live fetching log to avoid simultaneous requests being fired before react has processed the state changes.
              if (ApiHooksGlobal.isFetching(endpointHash, finalCacheKey) && !fetchSettings.allowSimultaneousRequests) {
                queryLog(
                  [
                    'Fetching aborted, request already in progress',
                    {
                      settings: fetchSettings,
                      paramHash: finalParamHash,
                      cacheKey: finalCacheKey,
                    },
                  ],
                  fetchSettings.debugKey
                );
                return;
              }
              // set the endpoint to "fetching" in the live fetching log, to prevent duplicate requests from being fired on component load.
              ApiHooksGlobal.setFetching(endpointHash, finalCacheKey, true);

              queryLog(['Fetching', { settings: fetchSettings, paramHash: finalParamHash, cacheKey: finalCacheKey }], fetchSettings.debugKey);

              // dispatch the loading action to change the fetching state
              dispatch?.(ApiHooksStore.Actions.loading(endpointHash, finalParamHash, finalCacheKey, mode, fetchSettings.maxCachingDepth));

              // set up a try/catch - we're about to make the actual request
              let value: any;
              try {
                // fetch the data value from either the real or mock endpoint, depending on the settings
                if (testKeys || fetchSettings.useMockEndpoints) {
                  if (!mockPromiseFactory) {
                    throw new Error(`API Hooks error - no mock endpoint has been defined for the following query: ${endpointHash}`);
                  }
                  value = await mockPromiseFactory(fetchSettings.parameters, testKeys?.[endpointHash]?.testKey);
                } else {
                  value = await promiseFactory(fetchSettings.parameters);
                }

                // store a copy of the previous fetch params before they get overwritten with the new ones
                const previousParams = { ...(lastUsedSettings.current?.parameters ?? {}) };

                // store the final settings for the processing hook
                lastUsedSettings.current = { ...fetchSettings };

                // send the data to the store by despatching the loaded action
                queryLog(['Fetch successful, with result:', value], fetchSettings.debugKey);
                dispatch?.(
                  ApiHooksStore.Actions.loaded(
                    endpointHash,
                    finalParamHash,
                    finalCacheKey,
                    fetchSettings.payloadModifier
                      ? fetchSettings.payloadModifier(storedStateSlice?.data, value, previousParams, fetchSettings.parameters)
                      : value,
                    fetchSettings.maxCachingDepth
                  )
                );
              } catch (error) {
                // an error has been thrown by the server, catch it and set it in state, otherwise throw it to the consumer.
                queryLog(['Fetch failed, with error:', error], fetchSettings.debugKey);
                dispatch?.(ApiHooksStore.Actions.error(endpointHash, finalParamHash, finalCacheKey, error, fetchSettings.maxCachingDepth));
              } finally {
                // set the request as finished fetching in the live fetching log so that future requests won't be aborted.
                ApiHooksGlobal.setFetching(endpointHash, finalCacheKey, false);
              }
            },
            [dispatch, setCacheKey, storedStateSlice, testKeys]
          );

          // invoke - called when the component mounts if autoInvoke = true, and from the manual invoke method
          // checks whether data should be fetched based on cache settings, error status & whether the params have changed
          const invoke = React.useCallback<(param?: any, fetchSettings?: UseQueryFetchSettings<any>, mode?: FetchingMode) => void>(
            (param, fetchSettings, mode = 'auto') => {
              // merge any params into existing settings passed from higher levels
              const finalSettings = {
                ...settingsFromHook,
                ...(param ? { parameters: { ...(settingsFromHook.parameters ?? {}), ...param } } : {}),
              };

              // if the manual invoke has been used with a payload modifier, add it on here.
              if (fetchSettings?.payloadModifier) {
                finalSettings.payloadModifier = fetchSettings.payloadModifier;
              }

              // read force network setting, from query setting first, then fetch settings if present.
              const forceNetwork = fetchSettings?.forceNetwork;

              // check for bookmark parameters, and read the stored value if appropriate
              if (finalSettings.caching?.bookmarkParameters && valueToReturn?.data && storedStateSlice?.paramHash) {
                for (const bookmark of finalSettings.caching?.bookmarkParameters) {
                  if (!finalSettings.parameters?.[bookmark]) {
                    const parsedHash = JSON.parse(storedStateSlice.paramHash);
                    if (parsedHash?.[bookmark]) {
                      finalSettings.parameters = { ...(finalSettings.parameters || {}), [bookmark]: parsedHash[bookmark] };
                      queryLog(['Loaded stored bookmark param', { paramName: bookmark, storedValue: parsedHash[bookmark] }], finalSettings.debugKey);
                    }
                  }
                }
              }

              // create a new param hash for comparison, we should make sure we invoke if the params are different to what's cached.
              const newParamHash = ApiHooksCaching.hashParams(finalSettings.parameters);

              // create a set of booleans containing information about the current state of the request/caching.
              const inErrorState = !!storedStateSlice?.error;
              const cacheIsStaleOrAbsent = !isCacheValid;
              const alreadyFetching = !!valueToReturn?.isFetching;
              const paramsAreDifferent = !finalSettings.invokeOnParamChange
                ? false
                : !!storedStateSlice && storedStateSlice.paramHash !== newParamHash;
              const refetchTriggerSet = !!storedStateSlice?.shouldRefetchData;

              // The logic which dictates whether to invoke a request, or whether we can use what we already have in cache.
              const shouldLoad =
                (cacheIsStaleOrAbsent && !alreadyFetching) || inErrorState || paramsAreDifferent || forceNetwork || refetchTriggerSet;

              queryLog(
                [
                  shouldLoad ? 'Invoking fetcher' : 'Cache loaded',
                  {
                    inErrorState,
                    cacheIsStaleOrAbsent,
                    alreadyFetching,
                    paramsAreDifferent,
                    forceNetwork,
                    refetchTriggerSet,
                  },
                ],
                finalSettings.debugKey
              );

              if (shouldLoad) {
                fetch(finalSettings, newParamHash, mode);
              }
            },
            [storedStateSlice, valueToReturn, settingsFromHook, fetch, isCacheValid]
          );

          // the manual invoke method is really just a proxy for invoke, with a bit of logging and settings application. returned as index 1 of the hook response for manual fetching
          const manualInvoke = React.useCallback<UseQueryResponse<any, any, any>[1]>(
            (...args) => {
              queryLog(['Manual invoke triggered'], settingsFromHook.debugKey);
              // apply default forceNetwork setting to manual invoke
              const newArgs = [...args];
              if (newArgs[1]?.forceNetwork === undefined) {
                newArgs[1] = { ...(newArgs[1] || {}), forceNetwork: settingsFromHook.forceNetworkOnManualInvoke };
              }
              invoke(newArgs[0], newArgs[1], 'manual');
            },
            [invoke, settingsFromHook]
          );

          /** FLOW MANAGEMENT EFFECTS */

          // Manage endpoint mount status
          React.useEffect(() => {
            ApiHooksGlobal.setMounted(endpointHash, cacheKey);
            return () => ApiHooksGlobal.setUnMounted(endpointHash, cacheKey);
          }, [cacheKey]);

          /** INVOCATION TRIGGER EFFECTS */

          // called when the component mounts, checks whether to invoke based on settings
          React.useLayoutEffect(() => {
            if (settingsFromHook.autoInvoke) {
              queryLog(['Auto invoke triggered'], settingsFromHook.debugKey);
              if (
                settingsFromHook.holdInvokeForCacheKeyParam &&
                settingsFromHook.cacheKey &&
                ApiHooksCaching.cacheKeyIsDefault(settingsFromHook.parameters, settingsFromHook.cacheKey)
              ) {
                queryLog(['Invoke held - cache key property has falsy value', { settings: settingsFromHook }], settingsFromHook.debugKey);
              } else {
                invoke();
              }
            }
          }, [!!settingsFromHook.autoInvoke]);

          // called when the params passed into the hook CHANGE, but NOT on first run - sets the new params/cache key and fetches data if the settings allow.
          React.useEffect(() => {
            if (!isFirstRender.current) {
              queryLog(['Parameters changed', { oldParams: storedStateSlice?.paramHash, newParams: paramHashFromHook }], settingsFromHook.debugKey);
              setCacheKey(ApiHooksCaching.parseCacheKey(settingsFromHook.parameters, settingsFromHook.cacheKey));
              if (settingsFromHook.invokeOnParamChange) {
                if (
                  settingsFromHook.holdInvokeForCacheKeyParam &&
                  settingsFromHook.cacheKey &&
                  ApiHooksCaching.cacheKeyIsDefault(settingsFromHook.parameters, settingsFromHook.cacheKey)
                ) {
                  queryLog(['Fetch held - cache key property has falsy value', { settings: settingsFromHook }], settingsFromHook.debugKey);
                } else {
                  fetch(settingsFromHook, paramHashFromHook, 'auto');
                }
              }
            }
          }, [paramHashFromHook]);

          /** REFETCH QUERY TRIGGER EFFECTS */

          // called when the entire cache is reset by a refetch query passed into a mutation
          React.useEffect(() => {
            if (!isFirstRender.current) {
              if (storedStateSlice?.shouldRefetchData) {
                queryLog(['Cache reset - refetch triggered', { parameters: lastUsedSettings.current?.parameters }], settingsFromHook.debugKey);
                invoke(lastUsedSettings.current?.parameters, undefined, 'refetch');
              }
            }
          }, [!!storedStateSlice?.shouldRefetchData]);

          /** UTILS */

          // mark the end of the first render - must come last
          React.useEffect(() => {
            isFirstRender.current = false;
          }, []);

          /** PROCESSING HOOK */

          const processed = processingHook?.('query', valueToReturn.data, valueToReturn.fetchingMode, lastUsedSettings.current);
          React.useEffect(() => {
            if (processingHook) {
              queryLog([`Processing hook executed`, { hookType: 'query', data: storedStateSlice?.data, processed }], settingsFromHook.debugKey);
            }
          }, [storedStateSlice?.data]);

          /** RETURN FROM HOOK */

          const valueToReturnWithProcessed = React.useMemo(() => ({ ...valueToReturn, processed }), [valueToReturn, processed]);

          // return the state value and the fetch method from the hook
          return [valueToReturnWithProcessed, manualInvoke];
        },
        /**
         * useMutation
         * - The hook to be used if the endpoint is a POST/PUT/DELETE and should NOT interface with the caching system
         * - Receives the hook execution level settings to override the system, application and hook level.
         * - Returns the fetch method to manually invoke, and a live response object
         * - Can only be used within a React Function Component
         */
        useMutation: (executionSettings: Partial<UseMutationSettings<any>> = {}): UseMutationResponse<any, any, any> => {
          /** MARK ENDPOINT AS USED */
          React.useEffect(() => {
            endpointUsed('mutation');
          }, []);

          // store response in state to return as index 1 from the hook
          const [isFetching, setIsFetching] = React.useState(false);
          const [fetchingMode, setFetchingMode] = React.useState<FetchingMode>('not-fetching');
          const [errorState, setErrorState] = React.useState<any>();
          const [data, setData] = React.useState();

          // get the dispatcher and test keys from context
          const [, dispatch, testKeys] = React.useContext(ApiHooksStore.Context);

          // store the last used fetch settings in a ref so that they can be passed to the processing hook.
          const lastUsedSettings = React.useRef<UseMutationSettings<any>>();

          // settings - apply the hook execution settings (if any) to the passed in system, application and endpoint level.
          // NOTE - the JSON.stringify prevents the need for the consumer to memoize the incoming execution settings, it's not ideal, but it's only a small object so it should be ok.
          const settingsFromHook = React.useMemo<UseMutationSettings<any>>(() => {
            const settings = { ...combinedMutationSettings, ...executionSettings };
            settings.parameters = { ...combinedMutationSettings.parameters, ...(executionSettings.parameters ?? {}) };
            if (executionSettings.refetchQueries) {
              settings.refetchQueries = [...(combinedMutationSettings.refetchQueries ?? []), ...executionSettings.refetchQueries];
            }
            return settings;
          }, [JSON.stringify(executionSettings)]);

          // the method used to dispatch refetch actions - these trigger the "refetch query" behaviour.
          const refetchQueries = React.useCallback<UseMutationResponse<any, any, any>[2]>(
            (queries) => {
              for (const query of queries) {
                let finalCacheKeyValue: string | number | undefined;
                try {
                  finalCacheKeyValue = ApiHooksCaching.cacheKeyValueFromRefetchQuery(
                    settingsFromHook.parameters,
                    query,
                    settingsFromHook.refetchQueryContext
                  );
                } catch (error) {
                  throw new Error(`API Hooks Mutation Error, Endpoint: ${endpointHash} - ${error?.message ?? 'Refetch query failed'}`);
                }
                mutationLog([`Refetch query processed`, { query, finalCacheKeyValue }], settingsFromHook.debugKey);
                dispatch?.(ApiHooksStore.Actions.refetch(query.endpointHash, finalCacheKeyValue?.toString()));
              }
            },
            [dispatch, settingsFromHook]
          );

          // fetch method - detached from cache, calls API and returns a promise
          const fetch = React.useCallback<UseMutationResponse<any, any, any>[0]>(
            async (param, settings) => {
              // combine all the settings together in order to include system, application, endpoint, execution and fetch level, as well as the passed in params.
              const finalSettings: UseMutationSettings<any> = {
                ...settingsFromHook,
                ...(settings || {}),
                ...(param ? { parameters: { ...(settingsFromHook.parameters ?? {}), ...param } } : {}),
              };

              // set live response to loading
              mutationLog([`Fetch started`, { finalSettings }], finalSettings.debugKey);
              setFetchingMode('manual');
              setIsFetching(true);

              // fetch the data value from either the real or mock endpoint, depending on the settings
              let value: any;
              try {
                if (testKeys || finalSettings.useMockEndpoints) {
                  if (!mockPromiseFactory) {
                    throw new Error(`API Hooks error - no mock endpoint has been defined for the following mutation: ${endpointHash}`);
                  }
                  value = await mockPromiseFactory(finalSettings.parameters, testKeys?.[endpointKey]?.testKey);
                } else {
                  value = await promiseFactory(finalSettings.parameters);
                }

                // store final settings used for processing hook
                lastUsedSettings.current = finalSettings;

                // set live response to success
                setData(value);
                setFetchingMode('not-fetching');
                setIsFetching(false);
                setErrorState(undefined);
                mutationLog([`Fetch successful`, { finalSettings, response: value }], finalSettings.debugKey);
                // handle any refetch queries that were passed in.
                if (finalSettings.refetchQueries) {
                  const resolvedRefetchQueries = finalSettings.refetchQueries.map((query) => {
                    return {
                      ...query,
                      cacheKeyValue: ApiHooksCaching.cacheKeyValueFromRefetchQuery(
                        finalSettings.parameters,
                        query,
                        finalSettings.refetchQueryContext
                      ),
                    };
                  });
                  refetchQueries(resolvedRefetchQueries);
                }
              } catch (error) {
                // set live response to failed
                setData(undefined);
                setFetchingMode('not-fetching');
                setIsFetching(false);
                setErrorState(error);
                mutationLog([`Fetch failed`, { error }], finalSettings.debugKey);
                if (finalSettings.throwErrors) {
                  throw error;
                }
              }
              // return the data, errors will be thrown for mutations and should be handled by the consuming component unless `throwErrors` is explicitly set to false in settings.
              return value;
            },
            [settingsFromHook, refetchQueries]
          );

          // run the processing hook
          const processed = processingHook?.('mutation', data, fetchingMode, lastUsedSettings.current);
          React.useEffect(() => {
            if (processingHook) {
              mutationLog([`Processing hook executed`, { hookType: 'mutation', data, processed }], settingsFromHook.debugKey);
            }
          }, [data]);

          // compile the live response
          const liveResponse = React.useMemo<UseMutationResponse<any, any, any>[1]>(
            () => ({
              data,
              isFetching,
              processed,
              fetchingMode,
              error: errorState,
            }),
            [data, fetchingMode, isFetching, processed, errorState]
          );

          return [fetch, liveResponse, refetchQueries];
        },
        /**
         * useRequest
         * - The hook to be used for any request for which we ONLY want the promise, no local state or caching at all.
         * - Receives the hook execution level settings to override the system, application and hook level.
         * - Returns the detached fetch method to manually invoke
         * - Can only be used within a React Function Component
         */
        useRequest: (executionSettings: Partial<UseRequestSettings<any>> = {}): UseRequestResponse<any, any> => {
          // settings - apply the hook execution settings (if any) to the passed in system, application and endpoint level.
          // NOTE - the JSON.stringify prevents the need for the consumer to memoize the incoming execution settings, it's not ideal, but it's only a small object so it should be ok.
          const settingsFromHook = React.useMemo<UseRequestSettings<any>>(() => {
            const settings = { ...combinedRequestSettings, ...executionSettings };
            settings.parameters = { ...combinedMutationSettings.parameters, ...(executionSettings.parameters ?? {}) };
            return settings;
          }, [JSON.stringify(executionSettings)]);

          // get any test keys
          const [, , testKeys] = React.useContext(ApiHooksStore.Context);

          // fetch method - detached from cache, calls API and returns a promise
          const fetch = React.useCallback<UseRequestResponse<any, any>>(
            async (param, settings) => {
              // combine all the settings together in order to include system, application, endpoint, execution and fetch level, as well as the passed in params.
              const finalSettings: UseRequestSettings<any> & { parameters?: any } = {
                ...settingsFromHook,
                ...(settings || {}),
                ...(param ? { parameters: { ...(settingsFromHook.parameters ?? {}), ...param } } : {}),
              };

              requestLog([`Fetch started`, { finalSettings }], finalSettings.debugKey);

              // fetch the data value from either the real or mock endpoint, depending on the settings
              let value: any;
              try {
                if (testKeys) {
                  if (!mockPromiseFactory) {
                    throw new Error(`API Hooks error - no mock endpoint has been defined for the following request: ${endpointHash}`);
                  }
                  value = await mockPromiseFactory(finalSettings.parameters, testKeys[endpointKey]?.testKey);
                } else {
                  value = await promiseFactory(finalSettings.parameters);
                }
                requestLog([`Fetch successful`, { finalSettings, response: value }], finalSettings.debugKey);
              } catch (error) {
                // set live response to failed
                requestLog([`Fetch failed`, { finalSettings, error }], finalSettings.debugKey);
                throw error;
              }
              // return the data, errors will be thrown for requests and should be handled by the consuming components.
              return value;
            },
            [settingsFromHook, testKeys]
          );

          return fetch;
        },
      };
      return controllerDictionary;
    }, {} as EndpointHooks<TController, TProcessingResponse>);
  }

  /**
   * The function that merges the system settings with any root settings passed to application level config.
   * Used by the "create" and "createMulti" methods
   * @param config The application level config for the useQuery and useMutation hooks. Overrides the system config but can potentially be overridden at endpoint and hook level
   * @returns Three dictionaries of merged settings for the three hook types.
   */
  function mergeRootSettings(config: CreationSettings<any, any, any> | CreationSettingsMulti<any, any>) {
    // apply application level query settings onto system level if any
    const rootQuerySettings: UseQueryConfigSettings<any, any> = { ...ApiHooksSystemSettings.systemDefaultQuery, ...(config.queryConfig ?? {}) };
    // apply application level query caching settings onto system level if any
    rootQuerySettings.caching = { ...rootQuerySettings.caching, ...(config.queryConfig?.caching ?? {}) };
    // apply application level mutation settings onto system level if any
    const rootMutationSettings: UseMutationSettings<any> = { ...ApiHooksSystemSettings.systemDefaultMutation, ...(config.mutationConfig ?? {}) };
    // apply application level request settings onto system level if any
    const rootRequestSettings: UseRequestSettings<any> = { ...ApiHooksSystemSettings.systemDefaultRequest, ...(config.requestConfig ?? {}) };

    return { rootQuerySettings, rootMutationSettings, rootRequestSettings };
  }

  /**
   * The create function takes a single API client and returns the hooks, config dictionaries, and mock endpoints dictionary.
   * @param apiClient The API client to parse, must be an object containing controller objects with nested endpoint functions
   * @param config The application level config for the useQuery and useMutation hooks. Overrides the system config but can potentially be overridden at endpoint and hook level
   * @returns The hooks
   */
  export function create<TApiClient = any, TProcessingResponse = undefined>(
    apiClient: TApiClient,
    config: CreationSettings<TApiClient, any, TProcessingResponse> = {}
  ) {
    if (config?.generalConfig?.debugMode) {
      log('API Hooks - creating hook/config library for (client/applicationConfig):', apiClient, config);
    }

    // merge root level settings
    const { rootQuerySettings, rootMutationSettings, rootRequestSettings } = mergeRootSettings(config);

    // create empty library or controller/endpoint objects to pass to settings factory and mock endpoint factory.
    const emptyHookConfigLibrary: HookConfigControllerLibrary<TApiClient> = createEmptyHookLibraryDefaults(apiClient);
    const emptyMockEndpointLibrary: MockEndpointControllerLibrary<TApiClient> = createEmptyHookLibraryDefaults(apiClient);
    const emptyDefaultDataLibrary: DefaultDataControllerLibrary<TApiClient> = createEmptyHookLibraryDefaults(apiClient);

    // create hook config object from factory function
    const hookConfig = config?.hookConfigFactory?.(emptyHookConfigLibrary) ?? emptyHookConfigLibrary;
    const mockEndpoints = config?.mockEndpointFactory?.(emptyMockEndpointLibrary) ?? emptyMockEndpointLibrary;
    const defaultData = config?.defaultDataFactory?.(emptyDefaultDataLibrary) ?? emptyDefaultDataLibrary;

    // Reduce client controller dictionary into hooks and config
    return Object.keys(apiClient).reduce<ControllerHooks<TApiClient, TProcessingResponse>>((memo, key) => {
      const newMemo = { ...memo };
      const controller = apiClient[key];
      newMemo[key] = createHooks(
        key,
        controller,
        rootQuerySettings,
        rootMutationSettings,
        rootRequestSettings,
        hookConfig[key],
        mockEndpoints[key],
        defaultData[key],
        config?.generalConfig,
        config?.processingHook
      );
      return newMemo;
    }, {} as ControllerHooks<TApiClient, TProcessingResponse>);
  }

  /**
   * The create function takes a dictionary of API clients and returns the hooks, config dictionaries, and mock endpoints dictionary.
   * @param apiClientDictionary A dictionary of API clients to parse, must be an object containing client key strings mapped to clients containing controller objects with nested endpoint functions
   * @param config The application level config for the useQuery and useMutation hooks. Overrides the system config but can potentially be overridden at endpoint and hook level
   * @returns The hooks
   */
  export function createMulti<TApiClientDictionary = Record<any, any>, TProcessingResponse = any>(
    apiClientDictionary: TApiClientDictionary,
    config: CreationSettingsMulti<TApiClientDictionary, any> = {}
  ): ControllerHooksMulti<TApiClientDictionary, TProcessingResponse> {
    if (config?.generalConfig?.debugMode) {
      log('API Hooks - creating "multi" hook/config library for (client/applicationConfig):', apiClientDictionary, config);
    }

    // merge root level settings
    const { rootQuerySettings, rootMutationSettings, rootRequestSettings } = mergeRootSettings(config);

    // factory for creating a new empty library for endpoint level config
    type GenericConfigLibrary =
      | HookConfigControllerLibraryMulti<TApiClientDictionary>
      | MockEndpointControllerLibraryMulti<TApiClientDictionary>
      | DefaultDataControllerLibraryMulti<TApiClientDictionary>;

    const createEmptyLibrary = <T extends GenericConfigLibrary>(): T => {
      return Object.keys(apiClientDictionary).reduce(
        (finalLibrary, incomingClientKey) => ({
          ...finalLibrary,
          [incomingClientKey]: createEmptyHookLibraryDefaults(apiClientDictionary[incomingClientKey]),
        }),
        {} as T
      );
    };

    // create empty library or controller/endpoint objects to pass to settings factory and mock endpoint factory.
    const emptyHookConfigLibrary = createEmptyLibrary<HookConfigControllerLibraryMulti<TApiClientDictionary>>();
    const emptyMockEndpointLibrary = createEmptyLibrary<MockEndpointControllerLibraryMulti<TApiClientDictionary>>();
    const emptyDefaultDataLibrary = createEmptyLibrary<DefaultDataControllerLibraryMulti<TApiClientDictionary>>();

    // create hook config object from factory function
    const clientHookConfig = config?.hookConfigFactory?.(emptyHookConfigLibrary) ?? emptyHookConfigLibrary;
    const clientMockEndpoints = config?.mockEndpointFactory?.(emptyMockEndpointLibrary) ?? emptyMockEndpointLibrary;
    const clientDefaultData = config?.defaultDataFactory?.(emptyDefaultDataLibrary) ?? emptyDefaultDataLibrary;

    return Object.keys(apiClientDictionary).reduce<ControllerHooksMulti<TApiClientDictionary, TProcessingResponse>>((clientMemo, clientKey) => {
      const newClientMemo = { ...clientMemo };
      const apiClient = apiClientDictionary[clientKey];
      const hookConfig = clientHookConfig[clientKey];
      const mockEndpoints = clientMockEndpoints[clientKey];
      const defaultData = clientDefaultData[clientKey];
      newClientMemo[clientKey] = Object.keys(apiClient).reduce((memo, key) => {
        const newMemo = { ...memo };
        const controller = apiClient[key];
        newMemo[key] = createHooks(
          key,
          controller,
          rootQuerySettings,
          rootMutationSettings,
          rootRequestSettings,
          hookConfig[key],
          mockEndpoints[key],
          defaultData[key],
          config?.generalConfig
        );
        return newMemo;
      }, {});
      return newClientMemo;
    }, {} as ControllerHooksMulti<TApiClientDictionary, TProcessingResponse>);
  }
}
