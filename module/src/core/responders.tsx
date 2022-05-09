import * as React from 'react';
import { ApiHooks } from './apiHooks';
import { ApiHooksCaching } from './caching';
import { ApiHooksStore } from './store';
import { ApiHooksSystemSettings } from './systemSettings';

/**
 * API Hooks - Responders
 * ----------------
 * A system for advanced cache management.
 *
 * This file contains everything relating to the responder library, includes:
 * - React provider
 * - Responder types
 * - Responder factory
 * - Responder tools and methods
 */
export namespace ApiHooksResponders {
  /** general utility type - represents a function  */
  type AnyFunction = (param: any) => any;

  /** type denoting the function passed to a listener hook, receives various params that a listener might need to interact with. */
  type ListenerCallback<TEndpoint extends AnyFunction, TSettings> = (params: {
    /** The data returned from the fetch being listened to - will be undefined if fetch returned an error */
    data?: ApiHooks.PromiseResult<ReturnType<TEndpoint>>;
    /** The error returned from the fetch being listened to - will be undefined if fetch was successful */
    error?: any;
    /** The cache key for the fetch being listened to */
    cacheKey?: string;
    /** The parameters sent to the fetch being listened to */
    params?: ApiHooks.FirstParamOf<TEndpoint>;
    /** The settings used for the fetch being listened to */
    settings: TSettings;
  }) => void;

  /** type denoting the listener hook */
  type Listener<TEndpoint extends AnyFunction, TSettings> = (callback: ListenerCallback<TEndpoint, TSettings>) => void;

  /** type denoting the three different listener types as dictionary - this is necessary to type the three different settings objects */
  interface Listeners<TEndpoint extends AnyFunction> {
    /** type denoting a listener that will respond to a fetch within a `useQuery` API hook */
    query: Listener<TEndpoint, ApiHooks.UseQuerySettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
    /** type denoting a listener that will respond to a fetch within a `useMutation` API hook */
    mutation: Listener<TEndpoint, ApiHooks.UseMutationSettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
    /** type denoting a listener that will respond to a fetch within a `useRequest` API hook */
    request: Listener<TEndpoint, ApiHooks.UseRequestSettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
  }

  /** an abstract class allowing accessor methods to be strictly typed to an incoming API client. */
  declare abstract class AccessorFactory<TApiClient = any> {
    constructor(data: TApiClient);

    /**
     * accessor method returning a listener dictionary for a specific endpoint
     * @param controllerKey the key to the API controller being accessed.
     * @param endpointKey the key to the API endpoint being accessed.
     * @returns a listener dictionary for the endpoint accessed.
     */
    public useListener<
      TControllerKey extends keyof TApiClient,
      TControllerData extends TApiClient[TControllerKey],
      TEndpointKey extends keyof TControllerData
    >(
      controllerKey: TControllerKey,
      endpointKey: TEndpointKey
    ): TControllerData[TEndpointKey] extends AnyFunction ? Listeners<TControllerData[TEndpointKey]> : never;

    /**
     * accessor method returning a cache setter for a specific endpoint
     * @param controllerKey the key to the API controller being accessed.
     * @param endpointKey the key to the API endpoint being accessed.
     * @returns a cache setter for the endpoint accessed.
     */
    public setCache<
      TControllerKey extends keyof TApiClient,
      TControllerData extends TApiClient[TControllerKey],
      TEndpointKey extends keyof TControllerData
    >(
      controllerKey: TControllerKey,
      endpointKey: TEndpointKey,
      data: TControllerData[TEndpointKey] extends AnyFunction ? ApiHooks.PromiseResult<ReturnType<TControllerData[TEndpointKey]>> : never,
      cacheKey?: string,
      params?: TControllerData[TEndpointKey] extends AnyFunction ? ApiHooks.FirstParamOf<TControllerData[TEndpointKey]> : never
    ): void;

    /**
     * accessor method returning a cache getter for a specific endpoint
     * @param controllerKey the key to the API controller being accessed.
     * @param endpointKey the key to the API endpoint being accessed.
     * @returns a cache getter for the endpoint accessed.
     */
    public getCache<
      TControllerKey extends keyof TApiClient,
      TControllerData extends TApiClient[TControllerKey],
      TEndpointKey extends keyof TControllerData
    >(
      controllerKey: TControllerKey,
      endpointKey: TEndpointKey,
      cacheKey?: string
    ): TControllerData[TEndpointKey] extends AnyFunction ? ApiHooks.PromiseResult<ReturnType<TControllerData[TEndpointKey]>> : never;
  }

  /**
   * the tools sent to a responder hook allowing it to interact with data and cache.
   */
  interface ResponderParams<TApiClient = any> {
    /** a tool allowing fetches from APIHooks to be listened to within a responder hook */
    useListener: AccessorFactory<TApiClient>['useListener'];
    /** a tool allowing pieces of APIHooks cache to be set manually from a responder hook */
    setCache: AccessorFactory<TApiClient>['setCache'];
    /** a tool allowing pieces of APIHooks cache to be retrieved from a responder hook */
    getCache: AccessorFactory<TApiClient>['getCache'];
  }

  /** type denoting a responder hook created by the factory to be passed into the provider */
  type ResponderHook = (state: ApiHooksStore.State, dispatch?: React.Dispatch<ApiHooksStore.Actions.GenericAction>) => void;

  /** type denoting an individual responder function defined by the consuming application */
  type Responder<TApiClient = any> = (params: ResponderParams<TApiClient>) => void;

  /** type denoting a listener ready to be called by APIHooks */
  interface RegisteredListener {
    /** the `controller.endpoint` hash of the endpoint in question */
    endpointHash: string;
    /** the function to call when the listener fires */
    callback: ListenerCallback<any, any>;
  }

  /** the three sets of listeners exported and ready to be called from within APIHooks.  */
  export const registeredQueryListeners: RegisteredListener[] = [];
  export const registeredRequestListeners: RegisteredListener[] = [];
  export const registeredMutationListeners: RegisteredListener[] = [];

  /**
   * tn effect allowing listeners to be registered and un-registered, used by responders.
   * @param endpointHash the `controller.endpoint` hash of the endpoint in question.
   * @param callback the function to call when the fetch is complete.
   * @param listenerArray The constant array in which to register the listener.
   */
  function useListenerEffect<TEndpoint extends AnyFunction, TSettings>(
    endpointHash: string,
    callback: ListenerCallback<TEndpoint, TSettings>,
    listenerArray: RegisteredListener[]
  ) {
    React.useEffect(() => {
      // register the incoming listener
      listenerArray.push({ endpointHash, callback });
      return () => {
        // remove the outgoing listener
        const outgoingListeners = listenerArray.filter((rl) => rl.endpointHash === endpointHash && rl.callback === callback);
        for (const outgoingListener of outgoingListeners) {
          listenerArray.splice(listenerArray.indexOf(outgoingListener), 1);
        }
      };
    }, [endpointHash, callback]);
  }

  /** the factory class created by the consuming application. allows responders to be created in a type safe way */
  class Factory<TApiClient> {
    /** the root `use` function allows the consuming app to create responders. */
    public use(responder: Responder<TApiClient>) {
      /** A new responder hook is created */
      const responderHook: ResponderHook = (state, dispatch) => {
        /** a memo of tools to pass back to the new responder */
        const params = React.useMemo(
          () => ({
            useListener: (controllerKey: string, endpointKey: string) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              return {
                query: (callback: ListenerCallback<any, any>) => {
                  useListenerEffect(endpointHash, callback, registeredQueryListeners);
                },
                mutation: (callback: ListenerCallback<any, any>) => {
                  useListenerEffect(endpointHash, callback, registeredMutationListeners);
                },
                request: (callback: ListenerCallback<any, any>) => {
                  useListenerEffect(endpointHash, callback, registeredRequestListeners);
                },
              };
            },
            getCache: (controllerKey: string, endpointKey: string, incomingCacheKey: string) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              const cacheKey = incomingCacheKey ?? ApiHooksCaching.defaultCacheKey;
              return state?.[endpointHash]?.[cacheKey]?.data;
            },
            setCache: (controllerKey: string, endpointKey: string, incomingData: string, incomingCacheKey: string, incomingParams: any) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              const cacheKey = incomingCacheKey ?? ApiHooksCaching.defaultCacheKey;
              const existingSlice = state?.[endpointHash]?.[cacheKey];
              dispatch?.(
                ApiHooksStore.Actions.loaded(
                  endpointHash,
                  incomingParams ? ApiHooksCaching.hashParams(incomingParams) : existingSlice?.paramHash ?? '',
                  cacheKey,
                  incomingData,
                  existingSlice?.maxCachingDepth ?? ApiHooksSystemSettings.systemDefaultQuery.maxCachingDepth
                )
              );
            },
          }),
          [state, dispatch]
        );
        return responder(params as ResponderParams<TApiClient>);
      };
      return responderHook;
    }
  }

  /** the root factory creator, receives the API Client to derive it's type only, es-lint disagrees with this approach but I like it. */
  // eslint-disable-next-line
  export function createFactory<TApiClient = any>(apiClient: TApiClient) {
    return new Factory<TApiClient>();
  }

  /** the props for the new responder provider */
  interface IProviderProps {
    /** an array of responder hooks created through a responder factory to register within the APIHooks */
    responders: ResponderHook[];
  }

  /**
   * this component isn't strictly a provider, it simply adds the responder hooks passed to it to the React environment
   * NOTE: this must be used INSIDE an APIHooks store provider.
   * FURTHER NOTE: armstrong users - please add this component INSIDE armstrong, (the APIHooks store provider should always be OUTSIDE armstrong)
   * */
  export const Provider: React.FC<React.PropsWithChildren<IProviderProps>> = ({ children, responders }) => {
    const [state, dispatch] = React.useContext(ApiHooksStore.Context);
    responders.forEach((responderHook) => responderHook(state, dispatch));
    return <>{children}</>;
  };
}
