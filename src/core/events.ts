import { ApiHooks } from './apiHooks';
import { ApiHooksStore } from './store';
/**
 * API Hooks - Events
 * ----------------
 * Events are triggered as part of the API Hooks lifecycle, and allow users to plug in their own functions at key stages of the process.
 */

/**
 * Class representing a store and get/set methods to manage a single event
 */
class EventManager<TCallback extends (...params: any[]) => any> {
  /**
   * The in-memory store for callback functions relating to this event
   */
  private readonly store: TCallback[] = [];

  /**
   * Checks whether a callback function exists in the store
   * @param callback A callback function reference to look for
   * @returns a boolean - true if exists
   */
  private eventHookExists(callback: TCallback): boolean {
    return this.store.some((storedCallback) => storedCallback === callback);
  }

  /**
   * Checks whether any callbacks have been registered for this event
   * @returns a boolean - true if exists
   */
  public hasEventHooks(): boolean {
    return !!this.store.length;
  }

  /**
   * Adds a callback to the store of callbacks for this event
   * @param callback The callback to add to the store
   * @returns An "unsubscribe" method for removing the callback from the store
   */
  public addEventHook(callback: TCallback) {
    if (!this.eventHookExists(callback)) {
      this.store.push(callback);
    }
    return () => this.removeEventHook(callback);
  }

  /**
   * Removes a callback from the store of callbacks for this event
   * @param callback The callback to remove from the store
   */
  public removeEventHook(callback: TCallback) {
    if (this.eventHookExists(callback)) {
      this.store.splice(this.store.indexOf(callback), 1);
    }
  }

  /**
   * Executes the registered callback functions for a specific event
   * @param args The arguments passed to each callback function
   * @returns The return value of the final callback executed
   */
  public executeEventHooks(...args: Parameters<TCallback>): ReturnType<TCallback> | undefined {
    return this.store.reduce<ReturnType<TCallback> | undefined>((__, storedCallback) => storedCallback(...args), undefined);
  }
}

/**
 * Root namespace to be exported for use
 * --------------------------------------
 * - Defines and exports a type for each event callback
 * - Creates and exports an event manager for each event
 */
export namespace ApiHooksEvents {
  /** TYPES */

  export type OnBeforeInitialStateCallback = (testKeys?: ApiHooksStore.TestKeyState) => ApiHooksStore.State | undefined;
  export type OnStateUpdated = (state: ApiHooksStore.State, testKeys?: ApiHooksStore.TestKeyState) => void;
  export type OnFetchStart = (endpointID: string, parameters: any, hookType: ApiHooks.HookType) => void;
  export type OnFetchSuccess = (endpointID: string, parameters: any, hookType: ApiHooks.HookType, response: any) => void;
  export type OnFetchError = (endpointID: string, parameters: any, hookType: ApiHooks.HookType, error: any) => void;

  /** MANAGERS */

  /**
   * The "onBeforeInitialState" event is triggered once just before the state is created.
   * - Only one callback should be registered to this event.
   * - Callback can return an initial state dictionary to load on first render
   * - If multiple callbacks are registered to this event, the return value of the LAST one registered will be used as initial state.
   */
  export const onBeforeInitialState = new EventManager<OnBeforeInitialStateCallback>();

  /**
   * The "onStateUpdated" event is triggered every time the APIHooks state is changed.
   * - Callbacks will receive the state object that has just been updated.
   * - Caution: Callbacks registered to this event will be called frequently
   */
  export const onStateUpdated = new EventManager<OnStateUpdated>();

  /**
   * The "onFetchStart" event is triggered every time the APIHooks state is changed.
   * - Callbacks will receive the endpointID, parameters (typed as any because it depends on the endpoint, can be cast.) and hook type.
   */
  export const onFetchStart = new EventManager<OnFetchStart>();

  /**
   * The "onFetchSuccess" event is triggered every time the APIHooks state is changed.
   * - Callbacks will receive the endpointID, parameters (typed as any because it depends on the endpoint, can be cast.), hook type, and API response (typed as any because it depends on the endpoint, can be cast.)
   */
  export const onFetchSuccess = new EventManager<OnFetchSuccess>();

  /**
   * The "onFetchError" event is triggered every time the APIHooks state is changed.
   * - Callbacks will receive the endpointID, parameters (typed as any because it depends on the endpoint, can be cast.), hook type, and API error (typed as any)
   */
  export const onFetchError = new EventManager<OnFetchError>();
}
