/**
 * API Hooks - Global
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains everything relating to global background storage that doesn't require a render, includes:
 * - Live request management - for simultaneous request prevention
 */
export namespace ApiHooksGlobal {
  /**
   * Create an in-memory store for logging endpoints that are fetching.
   * Background: Because react batches updates through the reducer, we can't rely on the 'status = loading' action when blocking
   * simultaneous calls to the same endpoint/cacheKey, we need an instant synchronous store in memory to do so.
   */
  const liveFetchingStore: { [key: string]: boolean } = {};

  /**
   * Creates a unique key from an endpoint & cacheKey combination.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  function createFetchingStoreKey(endpointKey: string, cacheKeyValue: string) {
    return `${endpointKey}-${cacheKeyValue}`;
  }

  /**
   * Logs the endpoint/cacheKey combination as fetching or not, used to block simultaneous requests on component load.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   * @param isFetchingValue Whether to set the endpoint/cacheKey as fetching or not.
   */
  export function setFetching(endpointKey: string, cacheKeyValue: string, isFetchingValue: boolean) {
    const fetchingStoreKey = createFetchingStoreKey(endpointKey, cacheKeyValue);
    if (isFetchingValue && !liveFetchingStore[fetchingStoreKey]) {
      liveFetchingStore[fetchingStoreKey] = true;
    } else if (!isFetchingValue && liveFetchingStore[fetchingStoreKey]) {
      delete liveFetchingStore[fetchingStoreKey];
    }
  }

  /**
   * Checks whether an endpoint/cacheKey combination is logged as already fetching.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  export function isFetching(endpointKey: string, cacheKeyValue: string): boolean {
    const fetchingStoreKey = createFetchingStoreKey(endpointKey, cacheKeyValue);
    return !!liveFetchingStore[fetchingStoreKey];
  }
}
