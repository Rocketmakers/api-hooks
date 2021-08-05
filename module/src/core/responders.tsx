import * as React from 'react';
import { ApiHooks } from './apiHooks';
import { ApiHooksCaching } from './caching';
import { ApiHooksStore } from './store';

export namespace ApiHooksResponders {
  /** general utility type - represents a function  */
  type AnyFunction = (param: any) => any;

  type ListenerCallback<TEndpoint extends AnyFunction, TSettings> = (params: {
    data?: ApiHooks.PromiseResult<ReturnType<TEndpoint>>;
    cacheKey?: string;
    params?: ApiHooks.FirstParamOf<TEndpoint>;
    settings: TSettings;
  }) => void;

  type Listener<TEndpoint extends AnyFunction, TSettings> = (
    callback: ListenerCallback<TEndpoint, TSettings>,
    dependencies?: React.DependencyList
  ) => void;

  interface Listeners<TEndpoint extends AnyFunction> {
    query: Listener<TEndpoint, ApiHooks.UseQuerySettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
    mutation: Listener<TEndpoint, ApiHooks.UseMutationSettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
    request: Listener<TEndpoint, ApiHooks.UseRequestSettings<ApiHooks.FirstParamOf<TEndpoint>, ApiHooks.PromiseResult<ReturnType<TEndpoint>>>>;
  }

  declare abstract class AccessorFactory<TApiClient = any> {
    constructor(data: TApiClient);

    public useListener<
      TControllerKey extends keyof TApiClient,
      TControllerData extends TApiClient[TControllerKey],
      TEndpointKey extends keyof TControllerData
    >(
      controllerKey: TControllerKey,
      endpointKey: TEndpointKey
    ): TControllerData[TEndpointKey] extends AnyFunction ? Listeners<TControllerData[TEndpointKey]> : never;

    public setCache<
      TControllerKey extends keyof TApiClient,
      TControllerData extends TApiClient[TControllerKey],
      TEndpointKey extends keyof TControllerData
    >(
      controllerKey: TControllerKey,
      endpointKey: TEndpointKey,
      data: TControllerData[TEndpointKey] extends AnyFunction ? ApiHooks.PromiseResult<ReturnType<TControllerData[TEndpointKey]>> : never,
      cacheKey?: string
    ): void;

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

  interface ResponderParams<TApiClient = any> {
    useListener: AccessorFactory<TApiClient>['useListener'];
    setCache: AccessorFactory<TApiClient>['setCache'];
    getCache: AccessorFactory<TApiClient>['getCache'];
  }

  type ResponderFactory = (state: ApiHooksStore.State, dispatch?: React.Dispatch<ApiHooksStore.Actions.GenericAction>) => void;
  type Responder<TApiClient = any> = (params: ResponderParams<TApiClient>) => void;

  interface RegisteredListener {
    endpointHash: string;
    callback: ListenerCallback<any, any>;
  }

  export const registeredQueryListeners: RegisteredListener[] = [];
  export const registeredRequestListeners: RegisteredListener[] = [];
  export const registeredMutationListeners: RegisteredListener[] = [];
  const responderHooks: ResponderFactory[] = [];

  function useListenerEffect<TEndpoint extends AnyFunction, TSettings>(
    endpointHash: string,
    callback: ListenerCallback<TEndpoint, TSettings>,
    dependencies: React.DependencyList = [],
    listenerArray: RegisteredListener[]
  ) {
    React.useEffect(() => {
      listenerArray.push({ endpointHash, callback });
      return () => {
        const outgoingListeners = listenerArray.filter((rl) => rl.endpointHash === endpointHash && rl.callback === callback);
        for (const outgoingListener of outgoingListeners) {
          listenerArray.splice(listenerArray.indexOf(outgoingListener), 1);
        }
      };
    }, [endpointHash, callback, ...dependencies]);
  }

  class Factory<TApiClient = any> {
    public use(responder: Responder<TApiClient>) {
      responderHooks.push((state, dispatch) => {
        const params = React.useMemo<ResponderParams<TApiClient>>(
          () => ({
            useListener: (controllerKey, endpointKey) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              return {
                query: (callback, dependencies) => {
                  useListenerEffect(endpointHash, callback, dependencies, registeredQueryListeners);
                },
                mutation: (callback, dependencies) => {
                  useListenerEffect(endpointHash, callback, dependencies, registeredMutationListeners);
                },
                request: (callback, dependencies) => {
                  useListenerEffect(endpointHash, callback, dependencies, registeredRequestListeners);
                },
              } as any;
            },
            getCache: (controllerKey, endpointKey, incomingCacheKey) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              const cacheKey = incomingCacheKey ?? ApiHooksCaching.defaultCacheKey;
              return state?.[endpointHash]?.[cacheKey]?.data;
            },
            setCache: (controllerKey, endpointKey, incomingData, incomingCacheKey) => {
              const endpointHash = `${controllerKey}.${endpointKey}`;
              const cacheKey = incomingCacheKey ?? ApiHooksCaching.defaultCacheKey;
              const existingSlice = state?.[endpointHash]?.[cacheKey];
              const data = incomingData;
              dispatch?.(ApiHooksStore.Actions.loaded(endpointHash, existingSlice?.paramHash ?? '', cacheKey, data, 10));
            },
          }),
          [state, dispatch]
        );
        return responder(params);
      });
    }
  }

  // eslint-disable-next-line
  export function createFactory<TApiClient = any>(apiClient: TApiClient) {
    return new Factory<TApiClient>();
  }

  export const Provider: React.FC = ({ children }) => {
    const [state, dispatch] = React.useContext(ApiHooksStore.Context);
    responderHooks.forEach((responderFactory) => responderFactory(state, dispatch));
    return <>{children}</>;
  };
}
