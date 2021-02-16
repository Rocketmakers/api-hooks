/**
 * API Hooks - Global
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains everything relating to global background storage that doesn't require a render, includes:
 * - Live request management - for simultaneous request prevention
 * - Live component mount management - so we know when a query is actively used on screen by a component.
 */
export namespace ApiHooksGlobal {
  interface IGlobalStoreSlice {
    isFetching: boolean;
    mountCount: number;
  }

  /**
   * Create an in-memory store for logging endpoints data.
   * Background to isFetching: Because react batches updates through the reducer, we can't rely on the 'status = loading' action when blocking
   * simultaneous calls to the same endpoint/cacheKey, we need an instant synchronous store in memory to do so.
   */
  const liveStore: { [key: string]: IGlobalStoreSlice } = {};

  /**
   * Creates a unique key from an endpoint & cacheKey combination.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  function createStoreKey(endpointKey: string, cacheKeyValue: string) {
    return `${endpointKey}-${cacheKeyValue}`;
  }

  /**
   * Creates an empty global slice with default values.
   */
  function createEmptySlice(): IGlobalStoreSlice {
    return { isFetching: false, mountCount: 0 };
  }

  /**
   * Checks whether a state slice matches the default values.
   * @param slice The incoming state slice.
   */
  function sliceIsEmpty(slice?: IGlobalStoreSlice): boolean {
    if (!slice) {
      return true;
    }
    const defaultValues = createEmptySlice();
    return Object.keys(slice).reduce((value, key) => {
      if (value) {
        return defaultValues[key] === slice[key];
      }
      return value;
    }, true);
  }

  /**
   * Modifies data in the store with null protection in place.
   * @param existingSlice The existing global slice to modify (will be created of not exists)
   * @param newData The new data to add to the global slice.
   */
  function setValueToSlice(existingSlice?: IGlobalStoreSlice, newData?: Partial<IGlobalStoreSlice>): IGlobalStoreSlice {
    let sliceToReturn: IGlobalStoreSlice = createEmptySlice();
    if (existingSlice) {
      sliceToReturn = { ...sliceToReturn, ...existingSlice };
    }
    if (newData) {
      sliceToReturn = { ...sliceToReturn, ...newData };
    }
    return sliceToReturn;
  }

  /**
   * Logs the endpoint/cacheKey combination as fetching or not, used to block simultaneous requests on component load.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   * @param isFetchingValue Whether to set the endpoint/cacheKey as fetching or not.
   */
  export function setFetching(endpointKey: string, cacheKeyValue: string, isFetchingValue: boolean) {
    const storeKey = createStoreKey(endpointKey, cacheKeyValue);
    liveStore[storeKey] = setValueToSlice(liveStore[storeKey], { isFetching: isFetchingValue });
    if (sliceIsEmpty(liveStore[storeKey])) {
      delete liveStore[storeKey];
    }
  }

  /**
   * Checks whether an endpoint/cacheKey combination is logged as already fetching.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  export function isFetching(endpointKey: string, cacheKeyValue: string): boolean {
    const storeKey = createStoreKey(endpointKey, cacheKeyValue);
    return !!liveStore[storeKey]?.isFetching;
  }

  /**
   * Logs that an endpoint/cacheKey combination is being mounted in a component.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  export function setMounted(endpointKey: string, cacheKeyValue: string) {
    const storeKey = createStoreKey(endpointKey, cacheKeyValue);
    const currentValue = liveStore[storeKey]?.mountCount ?? 0;
    liveStore[storeKey] = setValueToSlice(liveStore[storeKey], { mountCount: currentValue + 1 });
    if (sliceIsEmpty(liveStore[storeKey])) {
      delete liveStore[storeKey];
    }
  }

  /**
   * Logs that an endpoint/cacheKey combination is being un-mounted in a component.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  export function setUnMounted(endpointKey: string, cacheKeyValue: string) {
    const storeKey = createStoreKey(endpointKey, cacheKeyValue);
    const currentValue = liveStore[storeKey]?.mountCount ?? 0;
    liveStore[storeKey] = setValueToSlice(liveStore[storeKey], { mountCount: currentValue ? currentValue - 1 : 0 });
    if (sliceIsEmpty(liveStore[storeKey])) {
      delete liveStore[storeKey];
    }
  }

  /**
   * Checks whether an endpoint/cacheKey combination is logged as currently mounted.
   * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
   * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
   */
  export function isMounted(endpointKey: string, cacheKeyValue: string): boolean {
    const storeKey = createStoreKey(endpointKey, cacheKeyValue);
    return !!(liveStore[storeKey]?.mountCount > 0);
  }
}
