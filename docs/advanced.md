## Advanced features

Here are some of the more advanced API Hooks features. These features allow you to go beyond a simple "request / respond" relationship with the API in question, and turn the API Hooks library into a more advanced state management solution.

These features won't be necessary for all applications, but those that handle a lot of data may well find them useful.

### The Processing Hook

Most applications have elements of response processing that occur off the back of every (or nearly every) API request. The most obvious example is error handling.

API Hooks provides the opportunity to define a "processing hook" which will be injected into each of the three request hooks ([useQuery](hooks.md#usequery), [useMutation](hooks.md#usemutation) & [useRequest](hooks.md#userequest)).

The below code snippet shows how a central response processing hook can be used to show a "toast" notification when a server error occurs, and process any validation errors:

```TypeScript
interface ProcessingResponse {
  validationErrors: { key: string; message: string }[]
}

export const processingHook: ApiHooks.ProcessingHook<ProcessingResponse> = ({ hookType, fetchingMode, data, error, settings }) => {
  // toast
  const dispatch = useDispatchToast()

  // validation errors
  const validationErrors = React.useMemo<ProcessingResponse["validationErrors"]>(() => {
    if (hookType === "mutation" && data?.error?.status === 422) {
      return data.error.payload ?? []
    }
    return []
  }, [data, hookType])

  // server errors
  React.useEffect(() => {
    if (data?.error?.status === 500) {
      dispatch({ type: "error", content: data.error.payload ?? "Unexpected Error" })
    }
  }, [dispatch, data])

  return { validationErrors }
}
```

Once defined, applying this processing hook to your API Hooks instance is as simple as adding it to the central library configuration:
```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { processingHook } from "*Processing hook location.*"

export const apiHooks = ApiHooks.create(apiClient, {
  processingHook
});
```

NOTE: Anything returned from the processing hook will be sent to the `processed` property of every API request hook that you use. This property will be strictly typed to be the same shape as your processing hook response:
```TypeScript
const [addUser, { isFetching, processed }] = apiHooks.user.addUser.useMutation();

const validationErrors = processed?.validationErrors
```

---

### The Pre-processing Hook

Sometimes you need a centralized process which will allow you to abort requests made to the server on the basis of an initial check. A good example of this is to support offline network detection and prevent requests from being attempted if a mobile app is offline. The pre-processing hook allows you to do this.

Your pre-processing hook should return a single function which, in turn, returns a Promise of boolean. The request to the server will be aborted if this returned boolean is `false`.

```TypeScript
export const preProcessorHook: ApiHooks.PreProcessorHook = () => {

  // you can import other hooks or context here
  const dispatchError = useDispatchError();

  // define a function to be called before each request
  const checkNetworkStatus = React.useCallback<ApiHooks.PreProcessorChecker>(async () => {
    if (await isAppOffline()) {
      dispatchError('App is offline, please connect to the internet and try again')
      return false; // request to server will not fire
    }
    return true; // request to server will fire
  }, []);

  // return your function from the pre-processing hook
  return checkNetworkStatus;
};
```

Once defined, applying this pre-processing hook to your API Hooks instance is as simple as adding it to the central library configuration:
```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { processingHook } from "*Processing hook location.*"

export const apiHooks = ApiHooks.create(apiClient, {
  preProcessorHook
});
```

### Lifecycle Listeners

All three of the API request hooks ([useQuery](hooks.md#usequery), [useMutation](hooks.md#usemutation) and [useRequest](hooks.md#userequest)) provide listeners allowing a consuming hook or component to assign functions to various stages of the API Hooks lifecycle. This allows you to "hook into" stages of the process and perform side effects:

- `onFetchStart` is called immediately **before** a request is made to the API, it receives all settings passed to the hook as an object argument.
- `onFetchSuccess` is called immediately **after** a **successful** response has returned from the API, it receives the API response as it's first argument, and the settings passed to the hook as it's second argument.
- `onFetchError` is called immediately **after** a **failed** response has returned from the API, it receives the error as it's first argument, and the settings passed to the hook as it's second argument
- `onFetchComplete` is called immediately **after any** response has returned from the API, it receives the success response as it's first argument (will be undefined if the request failed), the error as it's second argument (will be undefined if the request succeeded), and the settings passed to the hook as it's third argument.

NOTE: Functions can be passed to these listeners at any config level (`application`, `endpoint` or `hook`), but be aware that if the same listener is used on the same endpoint at multiple config levels, **only the lowest level function will be executed** as the level settings override each other.

---

### Global Listeners

API Hooks global listeners allows functions to be defined which hook into the API Hooks lifecycle for **all** hook instances at a global level. This can be particularly useful for reading/writing cache to an external source.

For example, the below code snippet will read the entire API Hooks cache state from a local storage container, and write to that same container when state changes occur:
```TypeScript
ApiHooksEvents.onBeforeInitialState.addEventHook(() => {
  return JSON.parse(localStorage.getItem("my-data-store") ?? "{}")
})

ApiHooksEvents.onCacheUpdated.addEventHook((state) => {
  localStorage.setItem("my-data-store", JSON.stringify(state))
})
```

Here's a list of all global events that can be hooked into, some of these are similar to the hook level [lifecycle listeners](#lifecycle-listeners):
- `onBeforeInitialState` - called just before the initial render, receives any test keys that have been defined and **must return an object to be used as the initial state!**
- `onStateUpdated` - called every time a state change is made, receives the new state and any test keys that have been defined.
- `onCacheUpdated` - called every time the cached data changes, receives the new cached data state and any test keys that have been defined.
- `onFetchStart` - called immediately **before** a request is made to the API, it receives the `controller.endpoint` endpoint ID, any parameters sent to the request, and the hook type used (`query`, `mutation` or `request`)
- `onFetchSuccess` - called immediately **after** a **successful** response has returned from the API, it receives the `controller.endpoint` endpoint ID, any parameters sent to the request, and the hook type used (`query`, `mutation` or `request`), and the response from the API.
- `onFetchError` - called immediately **after** a **failed** response has returned from the API, it receives the `controller.endpoint` endpoint ID, any parameters sent to the request, and the hook type used (`query`, `mutation` or `request`), and the error from the API.

---

### Responders

A responder is a hook that exists once at a global level, it receives a set of methods designed to allow advanced state management at a global level. A responder is a powerful tool that can be used for a variety of functions, but it's primarily designed to:

1. Listens to the response from an API Hook and then...
2. ... update a _different_ piece of API Hooks cache based on the response.

#### For example:

- Our application has an infinitely paged list of users returned as an array of user objects from a `getUsers` query.
- We also have a `getUser` query which receives an identical user object, but for a single `id`, it uses this `id` as its cache key.
- Finally, we have an `updateUser` mutation which receives an updated user object and changes the data on the server.

We've set up a refetch query so that the `getUser` cache for a single user is re-fetched from the server when our `updateUser` has completed successfully, great! 🎉 But what about the user data for the updated user in our `getUserList` cache??..

... we _could_ set up a refetch query to also re-fetch `getUserList` from the server when a user is updated, but what about the paging? Do we return the list view to page one just because a single item has been updated? This is often undesirable from a UX point of view.

#### So let's use a responder to tie our user list view data to our single user mutation at application level:

```TypeScript
import { responders } from "../apiHooks"

/** create a new responder to manage the user flow */
export const userResponder = responders.use(({ useListener, setCache, getCache }) => {

  /** add a listener - this function will run whenever our `getUser` query responds meaning a user has been updated */
  useListener("user", "getUser").query(({ data }) => {
    /** make sure we have a successful response with data */
    if (data) {
      /** get the user list from cache */
      const listCache = getCache("user", "getUserList")
      /** is our updated user in the list? */
      if (listCache?.some((user) => (user.id === data.id))) {
        /** create an updated user list containing the changes made to our individual user */
        const updatedList = listCache.map((user) => (user.id === data.id ? data : user))
        /** store our new list in cache - this will re-render any components displaying the list automatically! */
        setCache("user", "getUserList", updatedList)
      }
    }
  })
})
```

The above code snipped shows a responder in action. A listener has been set up at a global level so that every time our `getUser` query responds with the latest data relating to a single user, we're updating that user's data in the list view cache as well! This list view update is made **synchronously on the client, with no need to re-fetch the list from the server** meaning that our infinitely paged list view will update on screen, maintaining the paging position.

So the flow for this example is now as follows:
1. The latest data relating to a single user is sent to the server through an `updateUser` mutation.
2. A refetch query is used so that our `getUser` query is re-fetched following the mutation, it responds with the latest changes.
3. A responder then listens to the response from `getUser` and synchronously updates the `getUserList` cache with the latest data.

The mutation is now essentially setting off an application-wide chain of events that insure all of our data is up to date in the most UX appropriate way, using a combination of server requests and client side cache updates. This chain will ensure that the data is always up to date every time the mutation in question is used.

#### Adding responders to your API Hooks setup

First of all, create a responders factory and export it alongside your initial API Hooks library:
```TypeScript
// API Hooks library
export const apiHooks = ApiHooks.create(apiClient, {
  generalConfig: {
    debugMode: true,
  },
  processingHook,
  hookConfigFactory: endpointMapFactory,
  defaultDataFactory: defaultDataFactory,
})

// responder factory
export const responders = ApiHooksResponders.createFactory(apiClient)
```

Responders can then be defined in separate files by importing the above factory and using it (see [this example](#so-lets-use-a-responder-to-tie-our-user-list-view-data-to-our-single-user-mutation-at-application-level))

Once you've defined some responders, add the APIHooksResponders provider to the provider stack wrapping your application, and pass your responders into it's `responders` prop as an array:
```TypeScript
class App extends React.Component {
  componentDidCatch() {
    console.error("TODO - handle error")
  }

  render() {
    return (
      <ApiHooksStore.Provider>
        <ApiHooksResponders.Provider responders={[userResponder]}>
          <HashRouter>
            <Shell />
          </HashRouter>
        </ApiHooksResponders.Provider>
      </ApiHooksStore.Provider>
    )
  }
}
```
NOTE: You'll notice that the `ApiHooksResponders.Provider` is _inside_ the standard `ApiHooksStore.Provider`. This is to allow your responders to use the standard library hooks if necessary, as well as their unique toolkit because remember, responders are just more hooks!

---

### Default Data

Sometimes it's useful to supply a [useQuery](hooks.md#usequery) hook with data to show on the first render of the app, before any requests are made to the server. This is particularly useful for isomorphic applications that are rendered synchronously on the server using data that has already been retrieved.

#### Supplying default data

Default data can be supplied via a factory function, in a very similar way to [endpoint level settings](#endpoint-level-settings). A function is configured for each endpoint which receives any endpoint parameters supplied to the hook, and returns a static set of strictly typed response data.

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "path/to/my/apiclient"

// this factory function can be in a different file for readability
export const defaultDataFactory: ApiHooks.DefaultDataLibraryFactory<typeof apiClient> = (emptyData) => {
  const defaultData = { ...emptyData }

  /****************************
   * Default data
   *****************************/

  defaultData.user.getUser = ({ id }) => ({
    id,
    firstName: "Fred",
    lastName: "Jones",
    email: "fred@jones.com",
  })

  return defaultData
}

const apiHooks = ApiHooks.create(apiClient, {
  // pass your factory to the defaultDataFactory property
  defaultDataFactory: myDefaultData
})
```

#### Activating default data

Telling API Hooks to use default data is achieved in an identical way to activating [mock endpoints](#testing-with-mock-endpoints), via a setting in query config called `useDefaultData`. This can be set at application, endpoint or hook level, depending on your needs.

---

### Payload Modifiers

On rare occasions, you may want to change the way data is stored by API Hooks, which can be achieved using a payload modifier as long as **the shape of the data doesn't change**

Infinite paging is the most common example of this being useful. The below code snippet will spread the incoming user list state into the existing list of users whilst avoiding duplication. This means the state will grow as requests are made rather than be replaced:
```TypeScript
  endpointMap.user.getUserList.query = {
    payloadModifier: (prevData, newData, prevParams, newParams) => {
      return [...prevData, ...newData.filter(d => !prevData.some(pd => pd.id === d.id))]
    }
  }
```

NOTE:
- This example is overly simplistic and probably dangerous, you'd likely need to read the paging parameters from `prevParams` and `newParams` to make sure your state is managed correctly based on the page requested and how it relates to the previous page requested.
- The above example has been added at [endpoint level](../docs/config.md#endpoint-level-settings), but it could have been defined at a different config level.

### Bookmark Parameters

Before attempting to use this feature, it's important to first have an overall understanding of API Hooks [caching](caching.md), especially the section on [config](caching.md#cache-config---optimizing-the-state).

On extremely rare occasions it's useful to specify an endpoint parameter as a "bookmark". Bookmark parameters work exactly like normal parameters, except when `undefined` they will instead send **the last value sent to the endpoint**. This is particularly useful for certain paged endpoints that use a cursor parameter.

Bookmark parameters are configured in the caching settings as follows:
```TypeScript
endpointMap.user.getProfilesPaged.query = {
  caching: {
    bookmarkParameters: ["cursor"]
  }
}
```

[Back to Index](../README.md)