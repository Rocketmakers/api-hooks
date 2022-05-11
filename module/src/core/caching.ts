import { ApiHooksStore } from './store';
import { ApiHooks } from './apiHooks';
import { EndpointIDs } from './endpointIDs';
import { ApiHooksGlobal } from './global';

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

  export type BookmarkParams<TParam> = (keyof TParam)[] | ((params: TParam) => Partial<TParam> | undefined);

  /**
   * Root type for the cache settings
   */
  export interface Settings<TParam> {
    /**
     * Cached data will be re-fetched when older than this value
     */
    staleIfOlderThan: Directive;
    /**
     * Cached data will be available in error state if older than this value
     */
    staleOnErrorIfOlderThan: Directive;
    /**
     * An optional array of params to mark as "bookmarks", meaning that if a request is made with a falsy value in one of these params, the value from the previous request will be used if it exists. This is useful primarily for paging cursors.
     */
    bookmarkParameters?: BookmarkParams<TParam>;
  }

  /** CONSTANTS */

  /** The system default cache key for when one isn't passed via the settings. */
  export const defaultCacheKey = 'all-data';

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
  export function parseCacheKey<TParam>(params?: TParam, cacheKey?: ApiHooks.UseQuerySettings<TParam, any>['cacheKey'], context?: any): string {
    if (cacheKey && params) {
      if (typeof cacheKey === 'function') {
        const finalKey = cacheKey(params, context);
        return finalKey ? String(finalKey) : defaultCacheKey;
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
      return (stateSlice?.timestamp ?? 0) + directive < Date.now();
    }
    return true;
  }

  /**
   * Checks a dictionary of state slices for one endpoint (each entry represents a set of params) and
   * cuts it down to the max number of entries by deleting the oldest.
   * @param endpointKey The key of the endpoint in question.
   * @param dictionary The slice of state to check (specific to an endpoint/params combination)
   * @param maxDepth The maximum number of entries allowed in a state slice (passed through from settings)
   */
  export function cleanEndpointDictionary<K extends keyof ApiHooksStore.State>(
    endpointKey: Extract<K, string>,
    dictionary: ApiHooksStore.State[K],
    maxDepth: number
  ) {
    const newDictionary = { ...dictionary };
    const keys = Object.keys(newDictionary || {});
    const overCacheSize = keys.length > maxDepth ? keys.length - maxDepth : 0;
    const keysToRemove: string[] = [];
    for (let i = 0; i < overCacheSize; i += 1) {
      const oldestKey = keys.reduce((memo, key) => {
        if (newDictionary[key].timestamp < newDictionary[memo].timestamp) {
          return key;
        }
        return memo;
      }, keys[0]);
      if (!ApiHooksGlobal.isMounted(endpointKey, oldestKey)) {
        keysToRemove.push(oldestKey);
      }
    }
    keysToRemove.forEach((key) => {
      delete newDictionary[key];
    });
    return newDictionary;
  }

  /**
   * Retrieves the value of the cache key property from a refetch query
   * @param params The params to look in
   * @param refetchQuery The refetch query in question
   * @param context The optional context object for the refetch query
   * @returns The value of the cache key if it exists
   */
  export function cacheKeyValueFromRefetchQuery<TParam>(
    params: TParam,
    refetchQuery: EndpointIDs.Response<TParam>,
    context?: any
  ): string | number | undefined {
    if (refetchQuery.cacheKeyValue) {
      return refetchQuery.cacheKeyValue;
    }
    if (refetchQuery.cacheKeyFromMutationParam) {
      const value = parseCacheKey(params, refetchQuery.cacheKeyFromMutationParam, context);
      if (!value) {
        throw new Error(`Invalid refetch query - mutation parameter ${refetchQuery.cacheKeyFromMutationParam} has no value!`);
      }
      return value;
    }
    return undefined;
  }

  /**
   * Converts the bookmark params property into a partial param object containing the passed values.
   * @param params The params to retrieve values from.
   * @param bookmarks The bookmark params object
   * @returns A partial param object or undefined if no bookmark values.
   */
  export function parseBookmarksIntoParamPartial<TParam>(params?: TParam, bookmarks?: BookmarkParams<TParam>): Partial<TParam> {
    if (!params || !bookmarks) {
      return {};
    }
    if (typeof bookmarks === 'function') {
      return bookmarks(params) ?? {};
    }
    return bookmarks.filter((b) => !!params[b]).reduce((compiledParams, bookmark) => ({ ...compiledParams, [bookmark]: params[bookmark] }), {});
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
