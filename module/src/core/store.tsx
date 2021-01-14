import * as React from "react"
import { ApiHooks } from "./apiHooks"
import { ApiHooksCaching } from "./caching"
import { ApiHooksEvents } from "./events"
/**
 * API Hooks - Store
 * ----------------
 * Parsing of the generated API client into a set of hooks.
 *
 * This file contains everything relating to the store, includes:
 * - React context
 * - React reducer
 * - Updater component
 * - Library of actions
 */
export namespace ApiHooksStore {
  /** TYPES */

  /** Root type for the state object */
  export type State = { [endpointKey: string]: { [paramHash: string]: StateSlice<any> } }

  //* * Type for a test key to be used when called from a test file */
  export type TestKeyState = { [endpointKey: string]: { testKey: string } }

  /**
   * Type for a single slice of data
   * - specific to one endpoint and set of parameters
   * @param status The current status of the stored data
   * @param data The stored data
   * @param error An API error if caught - is reset after a successful request
   * @param paramHash A string representing the specific set of parameters passed to this data request
   * @param timestamp The UNIX timestamp of the last request
   * @param shouldRefetchData A bool that triggers a refetch, this is set by the refetch queries logic.
   */
  export interface StateSlice<TData> {
    status?: "loading-manual" | "loading-auto" | "loading-refetch" | "loaded" | "error"
    data?: TData
    error?: any
    paramHash: string
    timestamp?: number
    shouldRefetchData?: boolean
  }

  /** UTILITIES */

  /**
   * Converts the fetching mode passed to the loading action to a loading-specific state slice status
   * @param mode the fetching mode used to invoke the fetcher.
   */
  export function stateSliceStatusFromFetchingMode(mode: ApiHooks.FetchingMode): StateSlice<any>["status"] {
    switch (mode) {
      case "auto":
        return "loading-auto"
      case "manual":
        return "loading-manual"
      case "refetch":
        return "loading-refetch"
      default:
        throw new Error(`Non-active fetching mode ${mode} passed to state slice during a loading action`)
    }
  }

  /**
   * Converts the state slice status into a fetching mode to be returned from the live response
   * @param status The current state slice status
   */
  export function fetchingModeFromStateSliceStatus(status: StateSlice<any>["status"]): ApiHooks.FetchingMode {
    switch (status) {
      case "loading-auto":
        return "auto"
      case "loading-manual":
        return "manual"
      case "loading-refetch":
        return "refetch"
      default:
        return "not-fetching"
    }
  }

  /** ACTIONS */

  export namespace Actions {
    /** TYPES */

    /**
     * Root type for a state update action sent from an API hook
     * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
     * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
     * @param paramHash A string representing the specific set of parameters passed to this data request
     * @param maxCachingDepth The maximum number of data sets to store for an endpoint - comes from a query config setting
     */
    export interface Action extends StateSlice<any> {
      endpointKey: string
      cacheKeyValue: string
      maxCachingDepth: number
      paramHash: string
    }

    /**
     * Root type for the data reset action
     * @param reset A constant 'true' - used by the reducer to detect a reset action
     * @param endpointKey (optional) Key of the endpoint to reset - resets all endpoints of not passed
     * @param cacheKeyValue (optional) A key to reset - each unique key will represent a different state slice in the dictionary.
     */
    export interface ResetAction {
      reset: true
      endpointKey?: string
      cacheKeyValue?: string
    }

    /**
     * Root type for the data refetch action
     * @param refetch A constant 'true' - used by the reducer to detect a refetch action
     * @param endpointKey (optional) Key of the endpoint to refetch - will mark all endpoints as needing a refetch of not passed
     * @param cacheKeyValue (optional) A key to refetch - each unique key will represent a different state slice in the dictionary.
     */
    export interface RefetchAction {
      refetch: true
      endpointKey?: string
      cacheKeyValue?: string
    }

    export type GenericAction = Action | ResetAction | RefetchAction

    /** ACTION FACTORIES */

    /**
     * Detects a reset action vs a state update or refetch action
     * @param action The action to check
     * @returns A boolean - true if reset action, false if state update action
     */
    export function isResetAction(action: React.ReducerAction<React.Reducer<State, GenericAction>>): action is ResetAction {
      return !!(action as ResetAction).reset
    }

    /**
     * Detects a refetch action vs a state update or reset action
     * @param action The action to check
     * @returns A boolean - true if reset action, false if state update action
     */
    export function isRefetchAction(action: React.ReducerAction<React.Reducer<State, GenericAction>>): action is RefetchAction {
      return !!(action as RefetchAction).refetch
    }

    /**
     * Factory function for creating a 'loading' state update action
     * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
     * @param paramHash A string representing the specific set of parameters passed to this data request
     * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
     * @param maxCachingDepth The maximum number of data sets to store for an endpoint - comes from a query config setting
     * @returns An action object to be dispatched
     */
    export function loading(
      endpointKey: string,
      paramHash: string,
      cacheKeyValue: string,
      mode: ApiHooks.FetchingMode,
      maxCachingDepth: number
    ): React.ReducerAction<React.Reducer<State, GenericAction>> {
      return { status: stateSliceStatusFromFetchingMode(mode), endpointKey, cacheKeyValue, paramHash, maxCachingDepth, shouldRefetchData: false }
    }

    /**
     * Factory function for creating a 'loaded' state update action
     * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
     * @param paramHash A string representing the specific set of parameters passed to this data request
     * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
     * @param data The data returned from the request
     * @param maxCachingDepth The maximum number of data sets to store for an endpoint - comes from a query config setting
     * @returns An action object to be dispatched
     */
    export function loaded<TData>(endpointKey: string, paramHash: string, cacheKeyValue: string, data: TData, maxCachingDepth: number): React.ReducerAction<React.Reducer<State, GenericAction>> {
      return { status: "loaded", timestamp: Date.now(), endpointKey, cacheKeyValue, paramHash, data, maxCachingDepth, error: undefined, shouldRefetchData: false }
    }

    /**
     * Factory function for creating an 'error' state update action
     * @param endpointKey A key specific to the endpoint (in format `controller.endpoint`)
     * @param paramHash A string representing the specific set of parameters passed to this data request
     * @param cacheKeyValue A key to cache the data by - each unique key will represent a different state slice in the dictionary.
     * @param requestError The error returned from the request
     * @param maxCachingDepth The maximum number of data sets to store for an endpoint - comes from a query config setting
     * @returns An action object to be dispatched
     */
    export function error(endpointKey: string, paramHash: string, cacheKeyValue: string, requestError: any, maxCachingDepth: number): React.ReducerAction<React.Reducer<State, GenericAction>> {
      return { status: "error", endpointKey, cacheKeyValue, paramHash, error: requestError, maxCachingDepth }
    }

    /**
     * Factory function for creating an 'reset' action
     * @param endpointKey (optional) Key of the endpoint to reset - resets all endpoints of not passed
     * @param cacheKeyValue (optional) A key to reset - each unique key will represent a different state slice in the dictionary.
     * @returns An action object to be dispatched
     */
    export function reset(endpointKey?: string, cacheKeyValue?: string): React.ReducerAction<React.Reducer<State, GenericAction>> {
      return { reset: true, endpointKey, cacheKeyValue }
    }

    /**
     * Factory function for creating an 'refetch' action
     * @param endpointKey (optional) Key of the endpoint to refetch - will mark all endpoints as needing a refetch of not passed
     * @param cacheKeyValue (optional) A key to refetch - each unique key will represent a different state slice in the dictionary.
     * @returns An action object to be dispatched
     */
    export function refetch(endpointKey?: string, cacheKeyValue?: string): React.ReducerAction<React.Reducer<State, Actions.Action | Actions.RefetchAction>> {
      return { refetch: true, endpointKey, cacheKeyValue }
    }
  }

  /**  STATE FLOW - context/reducer/updater */

  /**
   * API Hooks - React context
   * - Contains the state object and dispatch method
   * - All Api hooks listen for changes from this
   */
  export const Context = React.createContext<[State, React.Dispatch<React.ReducerAction<React.Reducer<State, Actions.GenericAction>>>, TestKeyState]>([{}, undefined, undefined])

  /**
   * Api Hooks - React reducer
   * - The single reducer for all changes in state
   * - Listens to actions dispatched from the hooks and builds the single state object
   * @param state The current state object
   * @param action The incoming action
   */
  export const reducer: React.Reducer<State, Actions.GenericAction | Actions.RefetchAction> = (state, action) => {
    // check for reset action and reset the endpoint data
    if (Actions.isResetAction(action)) {
      const { endpointKey, cacheKeyValue } = action
      if (endpointKey) {
        return {
          ...state,
          [endpointKey]: cacheKeyValue
            ? {
                ...(state[endpointKey] ?? {}),
                [cacheKeyValue]: undefined,
              }
            : undefined,
        }
      }
      return {}
    }
    // check for refetch action and set the shouldRefetchData endpoint to 'true' on the appropriate endpoints, triggering a refetch.
    if (Actions.isRefetchAction(action)) {
      const { endpointKey, cacheKeyValue } = action
      let stateIsModified = false
      const newState = { ...state }
      Object.keys(newState ?? {}).forEach((endpointKeyIndex) => {
        if (newState[endpointKeyIndex] && (!endpointKey || endpointKey === endpointKeyIndex)) {
          Object.keys(newState[endpointKeyIndex]).forEach((cacheKeyValueIndex) => {
            if (newState[endpointKeyIndex][cacheKeyValueIndex] && (!cacheKeyValue || cacheKeyValue === cacheKeyValueIndex)) {
              newState[endpointKeyIndex][cacheKeyValueIndex] = { ...newState[endpointKeyIndex][cacheKeyValueIndex], shouldRefetchData: true }
              stateIsModified = true
            }
          })
          if (stateIsModified) {
            newState[endpointKeyIndex] = { ...newState[endpointKeyIndex] }
          }
        }
      })
      if (stateIsModified) {
        return newState
      }
      return state
    }
    // rebuild the state object by applying changes from the action to the current state
    const { endpointKey, cacheKeyValue, maxCachingDepth, ...stateSlice } = action
    const newState = {
      ...state,
      [endpointKey]: {
        ...(state[endpointKey] ?? {}),
        [cacheKeyValue]: {
          ...(state[endpointKey]?.[cacheKeyValue] ?? {}),
          ...stateSlice,
        },
      },
    }
    // make sure the dictionary of state slices for this endpoint hasn't exceeded the maximum depth
    newState[endpointKey] = ApiHooksCaching.cleanEndpointDictionary(newState[endpointKey], maxCachingDepth)
    return newState
  }

  /**
   * Api Hooks - React Provider
   * - Must be imported and wrapped around the entire app
   * - Enables re-renders downstream when state changes
   * @param param0 The props for the provider component (should only be children)
   */
  export const Provider: React.FC<{ testKeys?: TestKeyState }> = ({ children, testKeys }) => {
    const initialState = React.useMemo(() => {
      return ApiHooksEvents.onBeforeInitialState.executeEventHooks(testKeys) ?? {}
    }, [])

    const [state, dispatch] = React.useReducer(reducer, initialState)

    React.useEffect(() => {
      if (ApiHooksEvents.onStateUpdated.hasEventHooks()) {
        ApiHooksEvents.onStateUpdated.executeEventHooks(state, testKeys)
      }
    }, [state])

    return <Context.Provider value={[state, dispatch, testKeys]}>{children}</Context.Provider>
  }
}
