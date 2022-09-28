import * as React from 'react';
import { ApiHooksCaching } from './caching';
import { ApiHooksStore } from './store';
import { ApiHooksSystemSettings } from './systemSettings';
import { ApiHooksGlobal } from './global';
import { EndpointIDs } from './endpointIDs';
import { Objects } from '../utils/objects';
import { ApiHooksEvents } from './events';
import { ApiHooksResponders } from './responders';

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
  export type PromiseResult<TPromise> = TPromise extends Promise<infer TResult> ? TResult : never;

  /** general utility type - gets the type of the first parameter in a function */
  export type FirstParamOf<TFunc extends AnyFunction> = Parameters<TFunc>[0];

  /** general utility type - differentiates between the three types of hook that can be used for an endpoint */
  export type HookType = 'query' | 'mutation' | 'request';

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

  /** Adds the three hooks to each endpoint within a controller (if it's a function within a controller, it's an endpoint) */
  export type EndpointHooks<TApiController, TProcessingResponse> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? {
          /** The hook to be used if the endpoint is a GET and should interface with the caching system. */
          useQuery: UseQuery<TApiController[TEndpointKey], TProcessingResponse>;
          /** The hook to be used if the endpoint is a POST/PUT/DELETE and we just need a fetcher and sone live, local state. without any caching. */
          useMutation: UseMutation<TApiController[TEndpointKey], TProcessingResponse>;
          /** The hook to be used for any request when we ONLY want the basic promise constructor, with no local state and no caching at all. */
          useRequest: UseRequest<TApiController[TEndpointKey]>;
          /** This hook returns a library of useful tools associated with a single endpoint. */
          useTools: UseTools<TApiController[TEndpointKey]>;
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

  /** Adds the config options to each endpoint within a controller (if it's a function within a controller, it's an endpoint) */
  type HookEndpointConfig<TApiController> = {
    [TEndpointKey in keyof TApiController]: TApiController[TEndpointKey] extends AnyFunction
      ? {
          /** The query settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level */
          query?: Partial<
            UseQueryConfigSettings<FirstParamOf<TApiController[TEndpointKey]>, PromiseResult<ReturnType<TApiController[TEndpointKey]>>>
          >;
          /** The mutation settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level */
          mutation?: Partial<
            UseMutationSettings<FirstParamOf<TApiController[TEndpointKey]>, PromiseResult<ReturnType<TApiController[TEndpointKey]>>>
          >;
          /** The request settings to apply to each endpoint, overrides the application settings, but can be overridden at hook level */
          request?: Partial<UseRequestSettings<FirstParamOf<TApiController[TEndpointKey]>, PromiseResult<ReturnType<TApiController[TEndpointKey]>>>>;
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
    mutationConfig?: Partial<UseMutationSettings<TParam, any>>;
    /**
     * The application level settings for the useRequest hook, can be overridden at endpoint and hook execution level
     */
    requestConfig?: Partial<UseRequestSettings<TParam, any>>;
    /**
     * The application level general settings, can not be overridden, apply generally at application level
     */
    generalConfig?: GeneralConfig;
  }

  interface ProcessingHookDetails<TRawResponse, TError> {
    /**
     * Either `query` or `mutation` depending on what type of API Hooks is calling the processing hook
     */
    hookType: HookType;
    /**
     * The ID of the endpoint being processed in `controller.endpoint` format.
     */
    endpointID: string;
    /**
     * Either `not-fetching` | `auto` | `manual` | `refetch` depending on why the data was fetched
     */
    fetchingMode: FetchingMode;
    /**
     * The response data from the API request
     */
    data?: TRawResponse;
    /**
     * The response error from the API request
     */
    error?: TError;
    /**
     * The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     */
    settings?: UseQuerySettings<any, any> | UseMutationSettings<any, any>;
    /**
     * The manual fetch method associated with the hook being used, typings will be different depending on whether it's `useQuery` or `useMutation`.
     */
    fetch:
      | ((param?: Partial<any> | undefined, fetchSettings?: UseQueryFetchSettings<TRawResponse> | undefined) => void)
      | ((param?: Partial<any> | undefined, fetchSettings?: Partial<UseMutationSettings<any, TRawResponse>> | undefined) => Promise<TRawResponse>);
  }

  /**
   * Type for the optional processing hook that can be passed to creating settings
   */
  export type ProcessingHook<TProcessingResponse, TResponseStructure = any, TErrorStructure = any> = <
    TRawResponse extends TResponseStructure,
    TError extends TErrorStructure
  >(
    details: ProcessingHookDetails<TRawResponse, TError>
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
     * @param fetchingMode - Either `not-fetching` | `auto` | `manual` | `refetch` depending on why the data was fetched
     * @param data - The response data from the API request
     * @param error - The error response from the API request
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
    endpointID: string;
  };

  /** LIFE CYCLE SETTINGS */

  export interface LifeCycleCallbackSettings<TResponse, TSettings> {
    /**
     * An optional callback function to run when a fetch is about to start
     * @param settings - The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     * @param fetchingMode - Either `not-fetching` | `auto` | `manual` | `refetch` depending on why the data was fetched. For a mutation, this can only be `not-fetching` or `manual`.
     */
    onFetchStart?: (settings: TSettings, fetchingMode: FetchingMode) => any;
    /**
     * An optional callback function to run when a fetch has completed successfully
     * @param response - The full response from the server.
     * @param settings - The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     */
    onFetchSuccess?: (response: TResponse, settings: TSettings) => any;
    /**
     * An optional callback function to run when a fetch has failed
     * @param error - The error response from the server.
     * @param settings - The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     */
    onFetchError?: (error: any, settings: TSettings) => any;
    /**
     * An optional callback function to run when a fetch has completed, regardless of whether it resulted in an error
     * @param response - The full response from the server, could be undefined if an error was returned.
     * @param error - The error response from the server, will be undefined if the fetch was successful.
     * @param settings - The final combined settings at the time of the fetch, typings will be different depending on whether it's `useQuery` or `useMutation`
     */
    onFetchComplete?: (response: TResponse | undefined, error: any | undefined, settings: TSettings) => any;
  }

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
   * @returns[2] A manual state setter for the state slice in question (DO NOT USE UNLESS YOU HAVE TO)
   */
  export type UseQueryResponse<TCache, TParam, TProcessingResponse> = [
    LiveResponse<TCache, TProcessingResponse>,
    (param?: Partial<TParam>, fetchSettings?: UseQueryFetchSettings<TCache>) => void,
    (newState: TCache, overrideSettings?: UseQueryConfigSettings<TParam, TCache>) => void
  ];

  /**
   * The basic query settings used at system, application, endpoint and hook execution level.
   */
  export interface UseQuerySettings<TParam, TResponse> extends LifeCycleCallbackSettings<TResponse, UseQuerySettings<TParam, TResponse>> {
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
     * (optional) Will hold any invocation until the parameter designated as the cacheKey has a non "falsy" value.
     */
    holdInvokeForCacheKeyParam: boolean;
    /**
     * Should manual invocations hit the server by default? Can be over-ridden during a manualInvoke with the `forceNetwork` setting
     */
    forceNetworkOnManualInvoke: boolean;
    /**
     * The parameters to send to the request
     */
    parameters?: Partial<TParam>;
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
    (settings?: Partial<UseMutationSettings<FirstParamOf<TEndpoint>, PromiseResult<ReturnType<TEndpoint>>>>): UseMutationResponse<
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
  export type UseMutationResponse<TResponse, TParam, TProcessingResponse> = [
    (param?: Partial<TParam>, fetchSettings?: Partial<UseMutationSettings<TParam, TResponse>>) => Promise<TResponse>,
    LiveResponse<TResponse, TProcessingResponse>,
    (refetchQueries: RefetchQueryDefinition<TParam, UseMutationSettings<TParam, TResponse>>) => void
  ];

  /**  */
  export type RefetchQueryDefinition<TParam, TSettings> = EndpointIDs.Response<TParam>[] | ((settings: TSettings) => EndpointIDs.Response<TParam>[]);

  /**
   * The basic mutation settings used at system, application, endpoint and hook execution level.
   */
  export interface UseMutationSettings<TParam, TResponse> extends LifeCycleCallbackSettings<TResponse, UseMutationSettings<TParam, TResponse>> {
    /**
     * @default true
     * Should the request throw errors? Or swallow them, allowing them to be handled via the live response object?
     */
    throwErrors?: boolean;
    /**
     * Should the hook always use the mock endpoint to fetch data, rather than the real endpoint?
     */
    useMockEndpoints?: boolean;
    /**
     * The parameters of the mutation request can be optionally defined here.
     */
    parameters?: Partial<TParam>;
    /**
     * A set of endpoint IDs denoting queries to be re-fetched after the mutation has happened.
     */
    refetchQueries?: RefetchQueryDefinition<TParam, UseMutationSettings<TParam, TResponse>>;
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
    (settings?: Partial<UseRequestSettings<Partial<FirstParamOf<TEndpoint>>, PromiseResult<ReturnType<TEndpoint>>>>): UseRequestResponse<
      PromiseResult<ReturnType<TEndpoint>>,
      Partial<FirstParamOf<TEndpoint>>
    >;
  }

  /**
   * The basic request settings used at system, application, endpoint and hook execution level.
   */
  export interface UseRequestSettings<TParam, TResponse> extends LifeCycleCallbackSettings<TResponse, UseRequestSettings<TParam, TResponse>> {
    /**
     * The parameters of the request can be optionally defined here.
     */
    parameters?: TParam;
    /**
     * A key to show in the debug logs, most useful at hook level to differentiate between two uses of the same hook when debugging.
     */
    debugKey?: string;
    /**
     * Should the hook always use the mock endpoint to fetch data, rather than the real endpoint?
     */
    useMockEndpoints?: boolean;
  }

  /**
   * The type denoting the response of the useRequest hook. receives the params + settings and returns a promise of the response data detached from all state and caching.
   * NOTE: The params and fetch settings here will override the params sent to the hook execution settings, but any hook execution params will be used if nothing is passed here.
   */
  type UseRequestResponse<TResponse, TParam> = (param?: TParam, fetchSettings?: Partial<UseRequestSettings<TParam, TResponse>>) => Promise<TResponse>;

  /** USE TOOLS TYPES */

  /**
   * The basic tools settings used at execution level only.
   */
  export interface UseToolsSettings {
    /**
     * A key to show in the debug logs, most useful at hook level to differentiate between two uses of the same hook when debugging.
     */
    debugKey?: string;
  }

  /** The type of the useTools hook, receives execution settings and returns a library of useful tools */
  export interface UseTools<TEndpoint extends AnyFunction> {
    (settings?: UseToolsSettings): UseToolsResponse<Partial<FirstParamOf<TEndpoint>>>;
  }

  /** Additional settings for a cache key specific refetch */
  export interface UseToolsRefetchAllCacheKeyConfig<TParam> extends ApiHooksStore.RefetchConfig<TParam> {
    cacheKeyValue: string | number;
  }

  /**
   * The type denoting the response of the useTools hook. A Library of useful tools.
   */
  export type UseToolsResponse<TParam> = {
    /**
     * Logs a refetch request for all queries associated with this endpoint only.
     * @param config (optional) Either an array of cache key specific configs, or a general config to be applied to all cache keys.
     * NOTE: If an array is passed here, only the cache key values supplied will be re-fetched.
     */
    refetchAllQueries: (config?: ApiHooksStore.RefetchConfig<TParam> | Array<UseToolsRefetchAllCacheKeyConfig<TParam>>) => void;
  };

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
  function createEmptyHookLibraryDefaults<TApiClient extends object, TLibrary>(apiClient: TApiClient): TLibrary {
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
  function createHooks<TController extends object, TProcessingResponse = undefined>(
    rootKey: string,
    controller: TController,
    rootQuerySettings: UseQueryConfigSettings<any, any>,
    rootMutationSettings: UseMutationSettings<any, any>,
    rootRequestSettings: UseRequestSettings<any, any>,
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
      const combinedQuerySettings = Objects.mergeDeep(rootQuerySettings, querySettings);

      // fetch endpoint level mutation settings if available and apply on top of the passed in system and application level settings
      const mutationSettings: Partial<UseMutationSettings<any, any>> = hookConfig[endpointKey]?.mutation ?? {};
      const combinedMutationSettings = Objects.mergeDeep(rootMutationSettings, mutationSettings);

      // fetch endpoint level request parameters if available and apply on top of the passed in system and application level settings
      const requestSettings: Partial<UseRequestSettings<any, any>> = hookConfig[endpointKey]?.request ?? {};
      const combinedRequestSettings = Objects.mergeDeep(rootRequestSettings, requestSettings);

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
       * Logs messages from useTools hooks to the console if in debug mode
       * - includes some data about the controller and endpoint
       * - calls the root logging utility function
       */
      const toolsLog = (messages: any[], debugKey?: string) => {
        if (generalConfig?.debugMode) {
          log(`API Hooks Tools, Endpoint: ${endpointHash}${debugKey ? ` - ${debugKey}` : ''} -`, ...messages);
        }
      };

      /**
       * An in memory storage container to avoid showing multiple config warnings for the same endpoint
       */
      const endpointWarningsShown: string[] = [];

      /**
       * Called when an endpoint is used with either a query or mutation hook.
       * Used to log a warning if the relevant config is missing.
       * @param type The type of hook that's been used
       */
      const endpointUsed = (type: HookType) => {
        if (
          generalConfig?.showMissingConfigWarnings &&
          !endpointWarningsShown.some((e) => e === endpointHash) &&
          ((!Object.keys(querySettings).length && type === 'query') || (!Object.keys(mutationSettings).length && type === 'mutation'))
        ) {
          const configExample = type === 'query' ? 'cache keys' : 'refetch queries';
          warn(
            `API Hooks WARNING! - The endpoint "${endpointHash}" has been used as a ${type} without any ${type} config defined at endpoint level. Do you need to add any config? (i.e. ${configExample})`
          );
          endpointWarningsShown.push(endpointHash);
        }
      };

      /**
       * Reducer used by useMutation to store live response state
       * @param state The current live response state
       * @param action A partial state to override the current
       * @returns The updated state
       */
      const mutationFetchResponseReducer: React.Reducer<
        Omit<UseMutationResponse<any, any, any>[1], 'processed'>,
        Partial<Omit<UseMutationResponse<any, any, any>[1], 'processed'>>
      > = (state, action) => {
        return { ...state, ...action };
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
            return Objects.mergeDeep(combinedQuerySettings, executionSettings) as UseQueryConfigSettings<any, any>;
          }, [
            JSON.stringify(executionSettings),
            executionSettings?.onFetchComplete,
            executionSettings?.onFetchError,
            executionSettings?.onFetchStart,
            executionSettings?.onFetchSuccess,
          ]);

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
                shouldRefetchData: undefined,
                maxCachingDepth: settingsFromHook.maxCachingDepth,
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
                shouldRefetchData: undefined,
                maxCachingDepth: settingsFromHook.maxCachingDepth,
              };
            }
            return currentStoredStateSlice;
          }, [state[endpointHash], cacheKey, settingsFromHook]);

          /**
           * Effect to handle the cache key changing without a re-mount.
           * - Essentially forces a virtual re-mount with the new state slice
           */
          React.useLayoutEffect(() => {
            isFirstRender.current = true;
            setCacheKey(cacheKeyValueFromHook);
          }, [cacheKeyValueFromHook]);

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
                  undefined,
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
              endpointID: endpointHash,
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

              ApiHooksEvents.onFetchStart.executeEventHooks(endpointHash, fetchSettings.parameters, 'query');
              fetchSettings.onFetchStart?.(fetchSettings, mode);

              // set up a try/catch - we're about to make the actual request
              let value: any;
              let error: any;
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
                ApiHooksEvents.onFetchSuccess.executeEventHooks(endpointHash, fetchSettings.parameters, 'query', value);
                fetchSettings.onFetchSuccess?.(value, fetchSettings);
              } catch (e) {
                // an error has been thrown by the server, catch it and set it in state, otherwise throw it to the consumer.
                error = e;
                queryLog(['Fetch failed, with error:', error], fetchSettings.debugKey);
                dispatch?.(ApiHooksStore.Actions.error(endpointHash, finalParamHash, finalCacheKey, error, fetchSettings.maxCachingDepth));
                ApiHooksEvents.onFetchError.executeEventHooks(endpointHash, fetchSettings.parameters, 'query', error);
                fetchSettings.onFetchError?.(error, fetchSettings);
              } finally {
                // set the request as finished fetching in the live fetching log so that future requests won't be aborted.
                ApiHooksGlobal.setFetching(endpointHash, finalCacheKey, false);
                fetchSettings.onFetchComplete?.(value, error, fetchSettings);
                // run responder listeners
                ApiHooksResponders.registeredQueryListeners
                  .filter((rl) => rl.endpointHash === endpointHash)
                  .forEach((rl) => {
                    queryLog(['Executing query responder listener'], fetchSettings.debugKey);
                    rl.callback({ data: value, error, cacheKey: finalCacheKey, params: fetchSettings.parameters, settings: fetchSettings });
                  });
              }
            },
            [dispatch, setCacheKey, storedStateSlice, testKeys]
          );

          // invoke - called when the component mounts if autoInvoke = true, and from the manual invoke method
          // checks whether data should be fetched based on cache settings, error status & whether the params have changed
          const invoke = React.useCallback<
            (param?: any, fetchSettings?: UseQueryFetchSettings<any>, mode?: FetchingMode, forceExclusiveParams?: boolean) => void
          >(
            (param, fetchSettings, mode = 'auto', forceExclusiveParams = false) => {
              // merge any params into existing settings passed from higher levels
              const finalSettings = Objects.mergeDeep(settingsFromHook, { parameters: param || {} }) as typeof settingsFromHook;

              // if the manual invoke has been used with a payload modifier, add it on here.
              if (fetchSettings?.payloadModifier) {
                finalSettings.payloadModifier = fetchSettings.payloadModifier;
              }

              // read force network setting, from query setting first, then fetch settings if present.
              const forceNetwork = fetchSettings?.forceNetwork;

              // is cache stale or absent?
              const cacheIsStaleOrAbsent = !isCacheValid;

              // check for bookmark parameters, and read the stored value if appropriate
              if (finalSettings.caching?.bookmarkParameters && valueToReturn?.data && storedStateSlice?.paramHash && !cacheIsStaleOrAbsent) {
                // get current values for incoming bookmark parameters, stripping out falsy values
                const bookmarkPartial = ApiHooksCaching.parseBookmarksIntoParamPartial(
                  finalSettings.parameters,
                  finalSettings.caching.bookmarkParameters
                );

                // get previous values for incoming bookmarks
                const parsedHash = JSON.parse(storedStateSlice.paramHash);
                const previousValues = ApiHooksCaching.parseBookmarksIntoParamPartial(parsedHash, finalSettings.caching.bookmarkParameters);

                // Spread previous values first, and then incoming values where not falsy, to make sure incoming value wins where defined, but previous value wins where undefined.
                finalSettings.parameters = Objects.mergeDeep(finalSettings.parameters || {}, previousValues, bookmarkPartial);
                queryLog(
                  [
                    'Loaded stored bookmark params where incoming param is undefined',
                    { incomingBookmarks: bookmarkPartial, storedBookmarks: previousValues },
                  ],
                  finalSettings.debugKey
                );
              }

              if (forceExclusiveParams && param) {
                finalSettings.parameters = param;
              }

              // create a new param hash for comparison, we should make sure we invoke if the params are different to what's cached.
              const newParamHash = ApiHooksCaching.hashParams(finalSettings.parameters);

              // create a set of booleans containing information about the current state of the request/caching.
              const inErrorState = !!storedStateSlice?.error;
              const alreadyFetching = !!valueToReturn?.isFetching;
              const paramsAreDifferent = !!finalSettings.invokeOnParamChange && !!storedStateSlice && storedStateSlice.paramHash !== newParamHash;
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

          // the manual state setter
          const manualSet = React.useCallback<UseQueryResponse<any, any, any>[2]>(
            (newState, overrideSettings) => {
              const finalSettings = { ...settingsFromHook, ...(overrideSettings ?? {}) };
              const finalCacheKey = ApiHooksCaching.parseCacheKey(finalSettings.parameters, finalSettings.cacheKey);
              const finalParamHash = ApiHooksCaching.hashParams(finalSettings.parameters);
              dispatch?.(ApiHooksStore.Actions.loaded(endpointHash, finalParamHash, finalCacheKey, newState, finalSettings.maxCachingDepth));
            },
            [settingsFromHook]
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
          }, [!!settingsFromHook.autoInvoke, cacheKey]);

          // called when the params passed into the hook CHANGE, but NOT on first run - sets the new params/cache key and fetches data if the settings allow.
          React.useEffect(() => {
            if (!isFirstRender.current) {
              queryLog(['Parameters changed', { oldParams: storedStateSlice?.paramHash, newParams: paramHashFromHook }], settingsFromHook.debugKey);
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
                let paramsToUse = lastUsedSettings.current?.parameters;
                let forceExclusiveParams = false;
                if (storedStateSlice.shouldRefetchData.params) {
                  switch (storedStateSlice.shouldRefetchData.paramMode ?? 'merge') {
                    case 'merge':
                      paramsToUse = Objects.mergeDeep(paramsToUse, storedStateSlice.shouldRefetchData.params);
                      break;
                    case 'replace':
                      paramsToUse = storedStateSlice.shouldRefetchData.params;
                      forceExclusiveParams = true;
                      break;
                    default:
                      throw new Error(`Invalid param override mode sent to refetch query ${storedStateSlice.shouldRefetchData.paramMode}`);
                  }
                }
                queryLog(['Refetch triggered', { parameters: paramsToUse }], settingsFromHook.debugKey);
                invoke(paramsToUse, undefined, 'refetch', forceExclusiveParams);
              }
            }
          }, [!!storedStateSlice?.shouldRefetchData]);

          /** UTILS */

          // mark the end of the first render - must come last
          React.useEffect(() => {
            isFirstRender.current = false;
          }, [cacheKey]);

          /** PROCESSING HOOK */

          const processingHookDetails = React.useMemo<ProcessingHookDetails<any, any>>(() => {
            return {
              endpointID: endpointHash,
              fetchingMode: valueToReturn.fetchingMode,
              hookType: 'query',
              data: valueToReturn.data,
              error: valueToReturn.error,
              settings: lastUsedSettings.current,
              fetch: manualInvoke,
            };
          }, [valueToReturn, lastUsedSettings.current, manualInvoke]);

          const processed = processingHook?.(processingHookDetails);
          React.useEffect(() => {
            if (processingHook) {
              queryLog([`Processing hook executed`, { hookType: 'query', data: storedStateSlice?.data, processed }], settingsFromHook.debugKey);
            }
          }, [storedStateSlice?.data]);

          /** RETURN FROM HOOK */

          const valueToReturnWithProcessed = React.useMemo(() => ({ ...valueToReturn, processed }), [valueToReturn, processed]);

          // return the state value and the fetch method from the hook
          return [valueToReturnWithProcessed, manualInvoke, manualSet];
        },
        /**
         * useMutation
         * - The hook to be used if the endpoint is a POST/PUT/DELETE and should NOT interface with the caching system
         * - Receives the hook execution level settings to override the system, application and hook level.
         * - Returns the fetch method to manually invoke, and a live response object
         * - Can only be used within a React Function Component
         */
        useMutation: (executionSettings: Partial<UseMutationSettings<any, any>> = {}): UseMutationResponse<any, any, any> => {
          /** MARK ENDPOINT AS USED */
          React.useEffect(() => {
            endpointUsed('mutation');
          }, []);

          // store response in state to return as index 1 from the hook
          const [fetchStateResponse, setFetchStateResponse] = React.useReducer(mutationFetchResponseReducer, {
            fetchingMode: 'not-fetching',
            isFetching: false,
            data: undefined,
            error: undefined,
            endpointID: endpointHash,
          });

          // get the dispatcher and test keys from context
          const [, dispatch, testKeys] = React.useContext(ApiHooksStore.Context);

          // store the last used fetch settings in a ref so that they can be passed to the processing hook.
          const lastUsedSettings = React.useRef<UseMutationSettings<any, any>>();

          // settings - apply the hook execution settings (if any) to the passed in system, application and endpoint level.
          // NOTE - the JSON.stringify prevents the need for the consumer to memoize the incoming execution settings, it's not ideal, but it's only a small object so it should be ok.
          const settingsFromHook = React.useMemo<UseMutationSettings<any, any>>(() => {
            return Objects.mergeDeep(combinedMutationSettings, executionSettings) as UseMutationSettings<any, any>;
          }, [
            JSON.stringify(executionSettings),
            executionSettings?.onFetchComplete,
            executionSettings?.onFetchError,
            executionSettings?.onFetchStart,
            executionSettings?.onFetchSuccess,
          ]);

          // the method used to dispatch refetch actions - these trigger the "refetch query" behaviour.
          const refetchQueries = React.useCallback<UseMutationResponse<any, any, any>[2]>(
            (queries) => {
              const settingsToUse = lastUsedSettings.current ?? settingsFromHook;
              const parsedQueries = typeof queries === 'function' ? queries(settingsToUse) : queries;
              for (const query of parsedQueries) {
                let finalCacheKeyValue: string | number | undefined;
                let queryConfig: ApiHooksStore.RefetchConfig | undefined;
                try {
                  finalCacheKeyValue = ApiHooksCaching.cacheKeyValueFromRefetchQuery(
                    settingsToUse.parameters,
                    query,
                    settingsToUse.refetchQueryContext
                  );
                  if (query.paramOverride) {
                    queryConfig = {
                      params: Objects.deepClone(query.paramOverride),
                      paramMode: query.paramOverrideMode ?? ('merge' as ApiHooksStore.RefetchParamOverrideMode),
                    };
                  }
                } catch (error: any) {
                  throw new Error(`API Hooks Mutation Error, Endpoint: ${endpointHash} - ${error?.message ?? 'Refetch query failed'}`);
                }
                mutationLog([`Refetch query processed`, { query, finalCacheKeyValue }], settingsToUse.debugKey);
                dispatch?.(ApiHooksStore.Actions.refetch(query.endpointHash, finalCacheKeyValue?.toString(), queryConfig));
              }
            },
            [dispatch, settingsFromHook]
          );

          // fetch method - detached from cache, calls API and returns a promise
          const fetch = React.useCallback<UseMutationResponse<any, any, any>[0]>(
            async (param, settings) => {
              // combine all the settings together in order to include system, application, endpoint, execution and fetch level, as well as the passed in params.
              const finalSettings: UseMutationSettings<any, any> = Objects.mergeDeep(settingsFromHook, settings || {}, { parameters: param || {} });

              // set live response to loading
              mutationLog([`Fetch started`, { finalSettings }], finalSettings.debugKey);
              setFetchStateResponse({ fetchingMode: 'manual', isFetching: true });

              ApiHooksEvents.onFetchStart.executeEventHooks(endpointHash, finalSettings.parameters, 'mutation');
              finalSettings.onFetchStart?.(finalSettings, 'manual');

              // fetch the data value from either the real or mock endpoint, depending on the settings
              let value: any;
              let error: any;
              try {
                if (testKeys || finalSettings.useMockEndpoints) {
                  if (!mockPromiseFactory) {
                    throw new Error(`API Hooks error - no mock endpoint has been defined for the following mutation: ${endpointHash}`);
                  }
                  value = await mockPromiseFactory(finalSettings.parameters, testKeys?.[endpointKey]?.testKey);
                } else {
                  value = await promiseFactory(finalSettings.parameters);
                }

                // store final settings used for processing hook and refetch queries.
                lastUsedSettings.current = finalSettings;

                // set live response to success
                setFetchStateResponse({ data: value, fetchingMode: 'not-fetching', isFetching: false, error: undefined });
                mutationLog([`Fetch successful`, { finalSettings, response: value }], finalSettings.debugKey);
                ApiHooksEvents.onFetchSuccess.executeEventHooks(endpointHash, finalSettings.parameters, 'mutation', value);
                finalSettings.onFetchSuccess?.(value, finalSettings);

                // handle any refetch queries that were passed in.
                if (finalSettings.refetchQueries) {
                  refetchQueries(finalSettings.refetchQueries);
                }
              } catch (e) {
                // set live response to failed
                error = e;
                setFetchStateResponse({ data: undefined, fetchingMode: 'not-fetching', isFetching: false, error });
                mutationLog([`Fetch failed`, { error }], finalSettings.debugKey);
                ApiHooksEvents.onFetchError.executeEventHooks(endpointHash, finalSettings.parameters, 'mutation', error);
                finalSettings.onFetchError?.(error, finalSettings);
              } finally {
                finalSettings.onFetchComplete?.(value, error, finalSettings);
                // run responder callbacks
                ApiHooksResponders.registeredMutationListeners
                  .filter((rl) => rl.endpointHash === endpointHash)
                  .forEach((rl) => {
                    mutationLog(['Executing mutation responder listener'], finalSettings.debugKey);
                    rl.callback({ data: value, error, params: finalSettings.parameters, settings: finalSettings });
                  });
              }
              // return the data, errors will be thrown for mutations and should be handled by the consuming component unless `throwErrors` is explicitly set to false in settings.
              if (error && finalSettings.throwErrors) {
                throw error;
              }
              return value;
            },
            [settingsFromHook, refetchQueries]
          );

          const processingHookDetails = React.useMemo<ProcessingHookDetails<any, any>>(() => {
            return {
              endpointID: endpointHash,
              fetchingMode: fetchStateResponse.fetchingMode,
              hookType: 'mutation',
              data: fetchStateResponse.data,
              error: fetchStateResponse.error,
              settings: lastUsedSettings.current,
              fetch,
            };
          }, [fetchStateResponse, lastUsedSettings.current, fetch]);

          // run the processing hook
          const processed = processingHook?.(processingHookDetails);
          React.useEffect(() => {
            if (processingHook) {
              mutationLog(
                [`Processing hook executed`, { hookType: 'mutation', data: fetchStateResponse.data, processed }],
                settingsFromHook.debugKey
              );
            }
          }, [fetchStateResponse.data]);

          // compile the live response
          const liveResponse = React.useMemo<UseMutationResponse<any, any, any>[1]>(
            () => ({ ...fetchStateResponse, processed }),
            [fetchStateResponse, processed]
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
        useRequest: (executionSettings: Partial<UseRequestSettings<any, any>> = {}): UseRequestResponse<any, any> => {
          // settings - apply the hook execution settings (if any) to the passed in system, application and endpoint level.
          // NOTE - the JSON.stringify prevents the need for the consumer to memoize the incoming execution settings, it's not ideal, but it's only a small object so it should be ok.
          const settingsFromHook = React.useMemo<UseRequestSettings<any, any>>(() => {
            const settings = { ...combinedRequestSettings, ...executionSettings };
            settings.parameters = { ...combinedMutationSettings.parameters, ...(executionSettings.parameters ?? {}) };
            return settings;
          }, [
            JSON.stringify(executionSettings),
            executionSettings?.onFetchComplete,
            executionSettings?.onFetchError,
            executionSettings?.onFetchStart,
            executionSettings?.onFetchSuccess,
          ]);

          // get any test keys
          const [, , testKeys] = React.useContext(ApiHooksStore.Context);

          // fetch method - detached from cache, calls API and returns a promise
          const fetch = React.useCallback<UseRequestResponse<any, any>>(
            async (param, settings) => {
              // combine all the settings together in order to include system, application, endpoint, execution and fetch level, as well as the passed in params.
              const finalSettings: UseRequestSettings<any, any> & { parameters?: any } = {
                ...settingsFromHook,
                ...(settings || {}),
                ...(param ? { parameters: { ...(settingsFromHook.parameters ?? {}), ...param } } : {}),
              };

              requestLog([`Fetch started`, { finalSettings }], finalSettings.debugKey);

              ApiHooksEvents.onFetchStart.executeEventHooks(endpointHash, finalSettings.parameters, 'request');
              finalSettings.onFetchStart?.(finalSettings, 'manual');

              // fetch the data value from either the real or mock endpoint, depending on the settings
              let value: any;
              let error: any;
              try {
                if (testKeys || finalSettings?.useMockEndpoints) {
                  if (!mockPromiseFactory) {
                    throw new Error(`API Hooks error - no mock endpoint has been defined for the following request: ${endpointHash}`);
                  }
                  value = await mockPromiseFactory(finalSettings.parameters, testKeys?.[endpointKey]?.testKey);
                } else {
                  value = await promiseFactory(finalSettings.parameters);
                }
                requestLog([`Fetch successful`, { finalSettings, response: value }], finalSettings.debugKey);
                ApiHooksEvents.onFetchSuccess.executeEventHooks(endpointHash, finalSettings.parameters, 'request', value);
                finalSettings.onFetchSuccess?.(value, finalSettings);
              } catch (e) {
                // set live response to failed
                error = e;
                requestLog([`Fetch failed`, { finalSettings, error }], finalSettings.debugKey);
                ApiHooksEvents.onFetchError.executeEventHooks(endpointHash, finalSettings.parameters, 'request', error);
                finalSettings.onFetchError?.(error, finalSettings);
              } finally {
                finalSettings.onFetchComplete?.(value, error, finalSettings);
                // run responder callbacks
                ApiHooksResponders.registeredRequestListeners
                  .filter((rl) => rl.endpointHash === endpointHash)
                  .forEach((rl) => {
                    requestLog(['Executing request responder listener'], finalSettings.debugKey);
                    rl.callback({ data: value, error, params: finalSettings.parameters, settings: finalSettings });
                  });
              }
              // return the data, errors will be thrown for requests and should be handled by the consuming components.
              if (error) {
                throw error;
              }
              return value;
            },
            [settingsFromHook, testKeys]
          );

          return fetch;
        },
        /**
         * useTools
         * - This hook returns a set of useful tools relating to the endpoint in question.
         * - Receives execution level settings only.
         */
        useTools: (executionSettings: UseToolsSettings = {}): UseToolsResponse<any> => {
          const [state, dispatch] = React.useContext(ApiHooksStore.Context);
          const myState = state[endpointHash];

          const debugKey = executionSettings?.debugKey;

          const refetchAllQueries = React.useCallback<UseToolsResponse<any>['refetchAllQueries']>(
            (config) => {
              if (!myState) {
                toolsLog(['Refetch triggered but no state for endpoint'], debugKey);
                return;
              }
              const cacheKeysToFetch = Array.isArray(config) && config.length ? config.map((c) => c.cacheKeyValue) : Object.keys(myState);
              for (const cacheKeyValue of cacheKeysToFetch) {
                const myStateSlice = myState[cacheKeyValue];
                if (!myStateSlice) {
                  toolsLog(['Refetch triggered but no state for endpoint with cacheKey value', { cacheKeyValue }], debugKey);
                  continue;
                }
                const myConfig = Array.isArray(config) ? config.find((c) => c.cacheKeyValue === cacheKeyValue) : config;
                toolsLog(['Processing refetch with config', { cacheKeyValue, config: myConfig }], debugKey);
                dispatch?.(ApiHooksStore.Actions.refetch(endpointHash, cacheKeyValue.toString(), myConfig && { ...myConfig }));
              }
            },
            [myState, debugKey]
          );

          return { refetchAllQueries };
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
    const rootMutationSettings: UseMutationSettings<any, any> = { ...ApiHooksSystemSettings.systemDefaultMutation, ...(config.mutationConfig ?? {}) };
    // apply application level request settings onto system level if any
    const rootRequestSettings: UseRequestSettings<any, any> = { ...ApiHooksSystemSettings.systemDefaultRequest, ...(config.requestConfig ?? {}) };

    return { rootQuerySettings, rootMutationSettings, rootRequestSettings };
  }

  /**
   * The create function takes a single API client and returns the hooks, config dictionaries, and mock endpoints dictionary.
   * @param apiClient The API client to parse, must be an object containing controller objects with nested endpoint functions
   * @param config The application level config for the useQuery and useMutation hooks. Overrides the system config but can potentially be overridden at endpoint and hook level
   * @returns The hooks
   */
  export function create<TApiClient extends object, TProcessingResponse = undefined>(
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
  export function createMulti<TApiClientDictionary extends object = Record<any, any>, TProcessingResponse = any>(
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
