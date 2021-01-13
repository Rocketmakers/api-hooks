import { ApiHooks } from './apiHooks';

/**
 * API Hooks
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains the system level default settings
 *
 * **NOTE: Settings should not be changed in here, they can be set at application, endpoint and hook level elsewhere**
 */
export namespace ApiHooksSystemSettings {
  /**
   * The system default useQuery config settings, can be overridden at application, endpoint and hook level.
   * @param autoInvoke true - By default, queries will execute when the component mounts
   * @param invokeOnParamChange true - By default, queries will re-execute when the parameters change
   * @param holdInvokeForCacheKeyParam true - By default, invocation will not occur until the parameter used as the cacheKey (if any) has a non "falsey" value
   * @param forceNetworkOnManualInvoke true - By default, manual invocations will always ignore cache and hit the server, on the assumption that a post mutation re-fetch is the most common use. This can be overridden with `forceNetwork` on a manual invoke.
   * @param maxCachingDepth 5 - By default, a maximum of 5 states slices (with different parameters) will be stored per endpoint
   */
  export const systemDefaultQuery: Partial<Omit<ApiHooks.UseQueryConfigSettings<any, any>, 'parameters'>> = {
    autoInvoke: true,
    invokeOnParamChange: true,
    holdInvokeForCacheKeyParam: true,
    forceNetworkOnManualInvoke: true,
    maxCachingDepth: 5
  };

  /**
   * The system default useMutation settings, can be overridden at application, endpoint and hook level.
   * @param fetchInBackground false - By default, data in the live response from a mutation will be cleared on fetch
   * @param throwErrors true - By default, errors from a mutation fetch will reject the promise rather than be swallowed by the hook
   */
  export const systemDefaultMutation: Partial<Omit<ApiHooks.UseMutationSettings<any>, 'parameters'>> = {
    fetchInBackground: false,
    throwErrors: true
  };

  /**
   * The system default useRequest settings, can be overridden at application, endpoint and hook level.
   */
  export const systemDefaultRequest: Partial<Omit<ApiHooks.UseRequestSettings<any>, 'parameters'>> = {};
}
