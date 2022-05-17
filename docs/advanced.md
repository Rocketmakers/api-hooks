## Advanced features

Here are some of the more advanced API Hooks features. These features allow you to go beyond a simple "request / respond" relationship with the API in question, and turn the API Hooks library into a more advanced state management solution.

These features won't be necessary for all applications, but those that handle a lot of data may well find them useful.

### Refetch Queries

Because the results of [useQuery](hooks.md#usequery) are cached, it's often necessary to make sure cached data doesn't hang around once we _know_ it's been changed, like after a [useMutation](hooks.md#usemutation) for example. API Hooks has a dedicated solution for managing this called `refetchQueries`.

Here are some examples:

#### Endpoint level refetch - "Whenever I create/update a user, I want to make sure my user cache is up to date"

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

// this factory function can be in a different file for readability
const myEndpointConfig: ApiHooks.HookConfigLibraryFactory<typeof apiClient> = (emptyConfig) => {
  const endpointSettings = { ...emptyConfig }

  endpointSettings.exampleQueries.getUser.query = {
    cacheKey: "id",
  }

  endpointSettings.exampleMutations.updateUser.mutation = {
    refetchQueries: [
      endpointIds.exampleQueries.getUser({ cacheKeyFromMutationParam: "id" }),
      endpointIds.exampleQueries.getUserList()
    ],
  }

    endpointSettings.exampleMutations.addUser.mutation = {
    refetchQueries: [
      endpointIds.exampleQueries.getUserList()
    ],
  }

  return endpointSettings
}

const apiHooks = ApiHooks.create(apiClient, {
  // pass your factory to the hookConfigFactory property
  hookConfigFactory: myEndpointConfig
})
```

Let's unpack what's happening here:

1. Whenever `updateUser` successfully runs from a [useMutation](hooks.md#usemutation) hook, all cache associated with the `getUserList` query will be invalidated, and so will all cache stored by `getUser` with a `cacheKey` that matches the `id` parameter sent to the `updateUser` mutation. To explain this further, if user `24` is updated for example, then all cache associated with user `24` will be invalidated, but cache stored by `getUser` relating to other user IDs will remain unaffected.
2. Whenever `addUser` successfully runs from a [useMutation](hooks.md#usemutation) hook, all cache associated with the `getUserList` will be invalidated.

NOTE:

- What does it mean when we say cache is "invalidated"? If there is a component rendered with a [useQuery](hooks.md#usequery) referencing the invalidated cache, then a new request for the data will fire immediately once the associated mutation is successful. If there is _not_ a component rendered with a [useQuery](hooks.md#usequery) referencing the invalidated cache, then any stored cache will simply be marked as invalid so that a new request will be fired in the event that a [useQuery](hooks.md#usequery) is mounted that references it.
- The config in the above example is defined at "endpoint level", meaning that these behaviors will apply to all associated hooks throughout the application. This is the recommended approach for `cacheKey` and `refetchQuery` config, because it means we don't need to remember to add these settings in every component which references this data. If need be though, all of this config can also be passed at "hook level."
- As well as `cacheKeyFromMutationParam`, a refetch query can also be defined with a `cacheKeyValue` property containing a hard value for the `cacheKey` to invalidate, this is more commonly used at "hook level" rather than endpoint level.
- If your `cacheKeyFromMutationParam` is inside an object being passed to the mutation, rather than a top level parameter, a function can also be passed to retrieve it, just like a normal `cacheKey`, for example:

```TypeScript
endpointSettings.exampleMutations.updateUser.mutation = {
  refetchQueries: [
    endpointIds.exampleQueries.getUser({ cacheKeyFromMutationParam: data => data.user.id }),
    endpointIds.exampleQueries.getUserList()
  ],
}
```

#### Defining refetch queries by factory function

To allow for more flexibility, the array of refetch queries can be returned from a factory function, allowing the list of requests to be dependent on the settings sent to the mutation.

In this example, the `id` property of our `updateUser` mutation is optional, and we only want to refetch the `getUser` query state **if** an `id` was passed to the mutation:

```TypeScript
endpointMap.user.updateUser.mutation = {
  refetchQueries: (settings) => {
    if (settings.parameters?.id) {
      return [endpointIdentifiers.user.getUser({ cacheKeyValue: settings.parameters.id })]
    }
    return []
  },
}
```

#### Refetch query context

Depending on the design of the API, it's sometimes the case that a query cache key needs more information than the contents of the mutation hook settings can provide. In these unusual cases, we can supply context from the hook that the refetch query can use to form a cache key.

In this example, the `getUser` endpoint requires a `categoryId` as well as the user's `id` in order to build the cache key for the query that needs to be re-fetched. The `categoryId` is not sent to the mutation, so we'll need to read it from context:
```TypeScript
endpointMap.user.updateUser.mutation = {
  refetchQueries: (settings) => {
    if (settings.parameters?.id && settings.refetchQueryContext?.categoryId) {
      return [endpointIdentifiers.user.getUser({ cacheKeyValue: `${settings.parameters.id}-${settings.refetchQueryContext.categoryId}` })]
    }
    return []
  },
}
```
In order for this to work, **all** components using this mutation will need to supply the necessary context, or the re-fetch will not execute. In this example, the `categoryId` is passed to the component as a prop, but it could come from anywhere:
```TypeScript
export const UserEdit: React.FC<{ categoryId: string }> = ({ categoryId }) => {

  const [updateUser, { isFetching: updating }] = apiHooks.user.updateUser.useMutation({
    refetchQueryContext: { categoryId }
  })
```

#### Advanced refetch query management

By default, an on-screen query that has been asked to perform a refetch will do so using the last parameters that were sent to it. If, however, you want to intercept that functionality, you can send some query params yourself.

This is particularly useful with paged queries, maybe the last request was for page `3` for example, and you want to ensure that the refetch request is for page `1`. For example:

```TypeScript
endpointSettings.exampleMutations.updateUser.mutation = {
  refetchQueries: [
    endpointIds.exampleQueries.getUser({ cacheKeyFromMutationParam: data => data.user.id }),
    endpointIds.exampleQueries.getUserList({
      paramOverride: { page: 1 },
      paramOverrideMode: 'merge'
    })
  ],
}
```
The `paramOverrideMode` can be `merge` or `replace` and will dictate whether the `paramOverride` params merge with the last params used, or replace them entirely, when performing the refetch.

Refetch queries can also be compiled dynamically based on the settings passed to the mutation, do this by passing a function instead of an array, the function will receive the settings as a parameter. For example:

```TypeScript
endpointMap.user.updateUser.mutation = {
  refetchQueries: (settings) => {
    const queries = [endpointIdentifiers.user.getUserList()]
    if (settings.parameters?.id) {
      queries.push(endpointIdentifiers.user.getUser({ cacheKeyValue: settings.parameters?.id }))
    }
    return [endpointIdentifiers.user.getUserList()]
  },
}
```

This example will perform an extra refetch if an optional param is passed.
---

### Lifecycle Listeners

All three of the API request hooks ([useQuery](hooks.md#usequery), [useMutation](hooks.md#usemutation) and [useRequest](hooks.md#userequest)) provide listeners allowing a consuming hook or component to assign functions to various stages of the API Hooks lifecycle. This allows you to "hook into" stages of the process and perform side effects:

- `onFetchStart` is called immediately **before** a request is made to the API, it receives all settings passed to the hook as an object argument.
- `onFetchSuccess` is called immediately **after** a **successful** response has returned from the API, it receives the API response as it's first argument, and the settings passed to the hook as it's second argument.
- `onFetchError` is called immediately **after** a **failed** response has returned from the API, it receives the error as it's first argument, and the settings passed to the hook as it's second argument
- `onFetchComplete` is called immediately **after any** response has returned from the API, it receives the success response as it's first argument (will be undefined if the request failed), the error as it's second argument (will be undefined if the request succeeded), and the settings passed to the hook as it's third argument.

NOTE: Functions can be passed to these listeners at any config level (`application`, `endpoint` or `hook`), but be aware that if the same listener is used on the same endpoint at multiple config levels, **only the lowest level function will be executed** as the level settings override each other.

### Responders

A responder is a hook that exists once at a global level, it receives a set of methods designed to allow advanced state management at a global level. A responder is a powerful tool that can be used for a variety of functions, but it's primarily designed to:

1. Listens to the response from an API Hook and then...
2. ... update a _different_ piece of API Hooks cache based on the response.

#### For example:

- Our application has an infinitely paged list of users returned as an array of user objects from a `getUsers` query.
- We also have a `getUser` query which receives an identical user object, but for a single `id`, it uses this `id` as it's cache key.
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

### Default Data

Sometimes it's useful to supply a [useQuery](hooks.md#usequery) hook with data to show on the first render of the app, before any requests are made to the server. This is particularly useful for isomorphic applications that are rendered synchronously on the server using data that has already been retrieved.

#### Supplying default data

Default data can be supplied via a factory function, in a very similar way to [endpoint level settings](#endpoint-level-settings). A function is configured for each endpoint which receives any endpoint parameters supplied to the hook, and returns a static set of strictly typed response data.

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

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

[Back to Index](../README.md)