import { ApiHooksStore } from './store';
import { ApiHooks } from './apiHooks';
import { EndpointIDs } from './endpointIDs';

/**
 * API Hooks - Caching
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains everything relating to the caching functionality, includes:
 * - Caching settings
 * - Caching utility functions
 */
export namespace ApiHooksCaching {
  /** TYPES */

  /**
   * A time instruction for the various cache validity settings
   * - number - a number of milliseconds
   * - 'always' - essentially represents infinity
   * - 'never' - essentially represents 0
   */
  export type Directive = number | 'always' | 'never';

  /**
   * Root type for the cache settings
   */
  export interface Settings<TParam> {
    /**
     * Cached data will be re-fetched when older than this value
     */
    staleIfOlderThan?: Directive;
    /**
     * Cached data will be available in error state if older than this value
     */
    staleOnErrorIfOlderThan?: Directive;
    /**
     * If true - the stale data will still be available whilst the new data is being fetched
     */
    fetchInBackground?: boolean;
    /**
     * An optional array of params to mark as "bookmarks", meaning that if a request is made with a falsy value in one of these params, the value from the previous request will be used if it exists. This is useful primarily for paging cursors.
     */
    bookmarkParameters?: (keyof TParam)[];
  }

  /** CONSTANTS */

  /** The system default cache key for when one isn't passed via the settings. */
  const defaultCacheKey = 'all-data';

  /** SETTINGS */

  /**
   * The system default cache settings
   * - Can be overridden at application level, endpoint level, and hook execution level.
   */
  export const systemDefaults: Settings<any> = {
    /**
     * 30000 - Cached data for a specific endpoint/param combination will be used for 30 seconds, and then re-requested the next time it's needed.
     */
    staleIfOlderThan: 30000,
    /**
     * 'never' - Cached data will always be used if the request is in an error state
     */
    staleOnErrorIfOlderThan: 'never',
    /**
     * true - Cached data will be available whilst the latest is being fetched - a spinner should be shown instead of the stale data where appropriate.
     */
    fetchInBackground: true,
  };

  /** UTILITIES */

  /**
   * Creates a unique string based on the parameters passed to the endpoint
   * Sorts the params and then stringifies
   * @param params The params to stringify
   */
  export function hashParams<TParam>(params?: TParam): string {
    if (!params) {
      return '{}';
    }
    return JSON.stringify(
      Object.keys(params)
        .sort()
        .reduce((memo, key) => ({ ...memo, [key]: params[key] }), {})
    );
  }

  /**
   * Receives a cacheKey setting value (which can be a param key or getter function) and returns the string value, returning a default to cache by if no setting passed.
   * @param cacheKey The cacheKey value passed through settings
   * @param params The params of the request
   */
  export function parseCacheKey<TParam>(params?: TParam, cacheKey?: ApiHooks.UseQuerySettings<TParam, any>['cacheKey']): string {
    if (cacheKey && params) {
      if (typeof cacheKey === 'function') {
        return cacheKey(params) ? String(cacheKey(params)) : defaultCacheKey;
      }
      return params[cacheKey] ? String(params[cacheKey]) : defaultCacheKey;
    }
    return defaultCacheKey;
  }

  /**
   * Receives a cacheKey setting value (which can be a param key or getter function) and returns true if a value for the cache key exists in the params, and is non "falsey", else false.
   * @param cacheKey The cacheKey value passed through settings
   * @param params The params of the request
   */
  export function cacheKeyIsDefault<TParam>(params?: TParam, cacheKey?: ApiHooks.UseQuerySettings<TParam, any>['cacheKey']): boolean {
    return parseCacheKey(params, cacheKey) === defaultCacheKey;
  }

  /**
   * Checks weather a piece of state is stale based on it's timestamp and the caching directive
   * @param stateSlice The slice of state to check (specific to an endpoint/params combination)
   * @param directive The caching directive (represents time in MS)
   */
  export function isStale<TData>(stateSlice: ApiHooksStore.StateSlice<TData>, directive: Directive) {
    if (stateSlice?.data) {
      if (directive === 'always') {
        return true;
      }
      if (directive === 'never') {
        return false;
      }
      return stateSlice?.timestamp + directive < Date.now();
    }
    return true;
  }

  /**
   * Checks a dictionary of state slices for one endpoint (each entry represents a set of params) and
   * cuts it down to the max number of entries by deleting the oldest.
   * @param dictionary The slice of state to check (specific to an endpoint/params combination)
   * @param maxDepth The maximum number of entries allowed in a state slice (passed through from settings)
   */
  export function cleanEndpointDictionary<K extends keyof ApiHooksStore.State>(dictionary: ApiHooksStore.State[K], maxDepth: number) {
    const newDictionary = { ...dictionary };
    const keys = Object.keys(dictionary || {});
    if (keys.length > maxDepth) {
      const oldestKey = keys.reduce((memo, key) => {
        if (newDictionary[key].timestamp < newDictionary[memo].timestamp) {
          return key;
        }
        return memo;
      }, keys[0]);
      delete newDictionary[oldestKey];
    }
    return newDictionary;
  }

  export function cacheKeyValueFromRefetchQuery<TParam>(params: TParam, refetchQuery: EndpointIDs.Response<TParam>): string | number {
    if (refetchQuery.cacheKeyValue) {
      return refetchQuery.cacheKeyValue;
    }
    if (refetchQuery.cacheKeyFromMutationParam) {
      const value = parseCacheKey(params, refetchQuery.cacheKeyFromMutationParam);
      if (!value) {
        throw new Error(`Invalid refetch query - mutation parameter ${refetchQuery.cacheKeyFromMutationParam} has no value!`);
      }
      return value;
    }
    return undefined;
  }

  /**
   * Some helper functions to shortcut cache times, split into namespaces for Minutes, Hours and Days.
   */
  export namespace Minutes {
    export function one() {
      return 60 * 1000;
    }
    export function five() {
      return one() * 5;
    }
    export function fifteen() {
      return five() * 3;
    }
    export function thirty() {
      return fifteen() * 2;
    }
  }

  export namespace Hours {
    export function one() {
      return Minutes.thirty() * 2;
    }
    export function five() {
      return one() * 5;
    }
  }

  export namespace Days {
    export function one() {
      return Hours.one() * 24;
    }
    export function seven() {
      return one() * 7;
    }
  }
}
