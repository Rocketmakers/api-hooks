import { ApiHooks } from './apiHooks';
import { ApiHooksCaching } from './caching';

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
   */
  export const systemDefaultQuery: Omit<ApiHooks.UseQueryConfigSettings<any, any>, 'parameters'> = {
    /**
     * @default true
     * Queries will execute when the component mounts
     */
    autoInvoke: true,
    /**
     * @default true
     * Queries will re-execute when the parameters change
     */
    invokeOnParamChange: true,
    /**
     * @default true
     * Invocation will not occur until the parameter used as the cacheKey (if any) has a non "falsey" value
     */
    holdInvokeForCacheKeyParam: true,
    /**
     * @default true
     * Manual invocations will always ignore cache and hit the server, on the assumption that a post mutation re-fetch is the most common use. This can be overridden with `forceNetwork` on a manual invoke.
     */
    forceNetworkOnManualInvoke: true,
    /**
     * @default 5
     * A maximum of 5 states slices (with different parameters) will be stored per endpoint
     */
    maxCachingDepth: 5,
    /**
     * By default, the system will block any request with the same endpoint/cacheKey whilst a request is already in progress. Setting this to true will override that behaviour and allow both requests to fire.
     */
    allowSimultaneousRequests: false,
    /**
     * Add system default caching settings from caching library.
     */
    caching: ApiHooksCaching.systemDefaults,
  };

  /**
   * The system default useMutation settings, can be overridden at application, endpoint and hook level.
   */
  export const systemDefaultMutation: Omit<ApiHooks.UseMutationSettings<any, any>, 'parameters'> = {
    /**
     * @default true
     * Errors from a mutation fetch will reject the promise rather than be swallowed by the hook
     */
    throwErrors: true,
  };

  /**
   * The system default useRequest settings, can be overridden at application, endpoint and hook level.
   */
  export const systemDefaultRequest: Omit<ApiHooks.UseRequestSettings<any, any>, 'parameters'> = {};
}
