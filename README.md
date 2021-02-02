# API Hooks

A front-end library for converting a REST API client into a library of useful React hooks for fetching, caching and displaying external data. The library is written in TypeScript and compiled to a JavaScript node module and accompanying typings.

## Prerequisite Libraries

```
React (17+)
React Dom (17+)
```

## API Client Format

The API Hooks create method needs to be passed an API Client object. This object essentially needs to be a structured library of methods that return promises, but how you fetch your data within those methods is up to you.

For your API Client to work with this library, it must adhere to the following controller based structure:

```TypeScript
class FirstController {
  getEndpoint = (args: { arg1?: string; arg2?: number }): Promise<string> => {
    // replace with data fetcher
    return Promise.resolve("hello world get")
  }
  postEndpoint = (args: { body?: string; }): Promise<string> => {
    // replace with data fetcher
    return Promise.resolve("hello world post")
  }
  // add additional endpoints to controller here
}

class ApiClient {
  firstController = new FirstController()
  // add additional controllers here
}

export const apiClient = new ApiClient()
```

---

## Getting Started

First of all, you'll need to import the API Hooks provider component and wrap the area of the DOM in which you'll be using API Hooks (usually the entire application.) NOTE: The provider component must only be used once in your app:

```TypeScript
import * as ReactDOM from "react-dom"
import { ApiHooksStore } from "@rocketmakers/api-hooks"
import { AppComponent } from "*Root app component location*"

ReactDOM.render(
  <ApiHooksStore.Provider>
    <AppComponent />
  </ApiHooksStore.Provider>,
  document.getElementById("host"))
)
```

Getting the core hook library up and running is as simple as calling the `create` method and passing an API Client object (described above):

```TypeScript
import { ApiHooks, EndpointIDs } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

export const apiHooks = ApiHooks.create(apiClient)
export const endpointIds = EndpointIds.create(apiClient)

```

The `apiHooks` constant above now contains a library of React hooks contained within an object structure that matches the controller/endpoint structure of your API Client.

NOTE: The `endpointIds` constant is a library of strictly types identifiers designed for use with some of API Hooks' more advanced features (such as `mock endpoints` and `refetch queries`.) It's not required for the basic hooks to work, so feel free to add it later if/when you need it.

---

## The Hooks

The library consists of three hooks that offer different interactions with your API. Each hook can be accessed by navigating through the controller and endpoint structure of your API client, using the result of the API Hooks `create` method as a starting point.

For example, if you stored the result of the `create` method in a constant called `apiHooks`, like the above example, that constant can now be imported and used in any component, as long as that component is rendered anywhere within the `ApiHooksStore.Provider` component:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [{data, isFetching}] = apiHooks.firstController.getEndpoint.useQuery();

}
```

Let's look at the three available hooks individually:

---

## The Hooks - useQuery

The `useQuery` hook is your primary data fetcher, and will usually be used exclusively with `GET` requests. Here are some of the core features:

- "Live" query parameters - meaning data will be automatically re-fetched when parameters change.
- A time-based caching system - stored per endpoint, and by a unique `cacheKey` property.
- Requests can be triggered automatically or manually.

Here are some typical examples:

### A list of users, fetched on component mount and rendered:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [{ data, isFetching }] = apiHooks.users.getAll.useQuery();

  if(isFetching) {
    return <Spinner />
  }

  return (
    <ul>
      {
        data?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))
      }
    </ul>
  )
}
```

### An individual user, fetched on component mount:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent<{ userId: string }> = (userId) => {

  const [{ data, isFetching }] = apiHooks.users.getById.useQuery({
    parameters: { id: userId },
    cacheKey: 'id'
  });

}
```

NOTE:

- The `cacheKey` here is a parameter of the request representing a unique identifier. A new area will therefore be created within the cache store for each user. If the `cacheKey` was omitted here, a single area will be created within the cache store for the `users.getById` endpoint, this area will be re-used for each request.
- The `cacheKey` property is vital here to prevent data for "user A" being returned for "user B".

HINT: Cache Keys can also be created from more than one parameter by using a factory function instead of supplying a parameter name. Like this:

```TypeScript
{
  cacheKey: params => `${params.groupId}-${params.userId}`;
}
```

### A manual fetch, triggered by a button:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [{ data, isFetching }, fetchUserList] = apiHooks.users.getAll.useQuery({
    autoInvoke: false
  });

  return (
    <button onClick={() => fetchUserList()}>Get Users</button>
  )
}
```

NOTE:

- By default, queries will be invoked when the component loads, so if you really want to send the request manually, you'll need to remember the `autoInvoke: false` setting.
- Manual fetches will always attempt to fetch from the server, regardless of any valid cache, this can be overridden by passing `{forceNetwork: false}` to the second argument of the manual fetch function.
- Parameters can be sent to a query via the first argument of the manual fetch function.

---

## The Hooks - useMutation

The `useMutation` hook is your primary data editor, and will usually be used with `POST`, `PUT` and `DELETE` requests. Here are some of the core features:

- The response is returned in a promise by the invoke function, and also from the hook as a live response.
- Unlike `useQuery`, responses from `useMutation` are _not_ cached globally.
- Unlike `useQuery`, mutations are _never_ invoked automatically, and _must_ be invoked via the function returned from the hook.

Here are some typical examples:

### Create a new user

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [postUser, { isFetching }] = apiHooks.users.postUser.useMutation()

  const createUser = React.useCallback((userData) => {
    postUser(userData)
  }, [postUser])
}
```

NOTE:

- `useMutation` returns the invoke method as the _first_ argument in the response array, unlike queries which are invoked automatically and therefore the live response is the first argument.
- Parameters can be passed into the hook with the `parameters` property, just like a query, but with a mutation it's more common to pass the parameters to the invoke method.
- Parameters can also be split between the hook and the invoke method, with some going into the hook `parameters` property, and the rest going into the invoke method at fetch time.

### Chaining two mutations, using a property of the response from A to call B.

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [postGroup, { isFetching: groupIsFetching }] = apiHooks.users.postGroup.useMutation()
  const [postUser, { isFetching: userIsFetching }] = apiHooks.users.postUser.useMutation()

  const createUserAndGroup = React.useCallback(async (userData, groupData) => {
    const newUser = await postUser(userData)
    if(newUser?.id) {
      await postGroup({...groupData, adminUserId: newUser.id})
    }
  }, [postUser, postGroup])
}
```

NOTE:

- It's important to note that queries can _not_ be used in this was, as for the caching system to function properly, queries can't return a promise like mutations can.

---

## The Hooks - useRequest

The `useRequest` hook is the simplest, and will likely be by far the least used hook in your application. It's designed to be used with `GET` requests that provide "look up" data for things like searches and autocomplete inputs, and therefore don't need to be cached or provide a data response from the hook.

Here are some typical examples:

### Populating a list of selectable users as the user types:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const searchUsers = apiHooks.users.search.useRequest()

  const [userList, setUserList] = React.useState([])

  const populateUserListFromInput = React.useCallback((searchInput) => {
    const newUserList = await searchUsers({query: searchInput})
    setUserList(newUserList)
  }, [searchUsers, setUserList])
}
```

NOTE:

- A `useQuery` would have worked here, and may have been more appropriate. `useRequest` exists as a way of accessing your API fetch methods in a way that bypasses most of the API Hooks functionality, kind of a "manual override."
- Unlike the other two hooks, the `useRequest` hook doesn't return an array for de-structuring. This is because the response is completely unprocessed, it only returns a function for accessing the raw API fetch method.

---

## Configuring API Hooks

With a few exceptions, the configuration options for API Hooks can be applied at three different levels, with individual settings "falling back" to the higher level if they have not been defined at the lower level. These levels are, from top to bottom:

1. `System Level` - The system level settings are applied by default and should not be changed directly, only overridden.
2. `Application Level` - Application level settings will override the system level settings and apply to the entire application unless overridden lower down.
3. `Endpoint Level` - Endpoint level settings will override the system and application level settings and apply to a single endpoint wherever it is used. (An "endpoint" in this definition means any function within a controller on your API Client, e.g. `firstController.getEndpoint`.)
4. `Hook Level` - Hook level settings will override the three previous levels, and apply to one instance of `useQuery`, `useMutation` or `useRequest` _only_.
5. `Fetch Level` - **some** settings (such as endpoint parameters) can be supplied when an invoke function is executed for one of the hooks. These settings will apply to that fetch only.

NOTE: Settings that can be overridden are split into separate areas for the three different hooks, `query`, `mutation` and `request`. The application level also has some other settings which can **only** be set for the entire application.

Let's take a single setting, in this case the `staleIfOlderThan` setting within the `caching` area of the `query` settings, and see how we apply a change at all of the different levels:

---

## Configuring API Hooks - Application Level Settings

Application level settings are passed into the `create` method used to initialize the API Hooks library, they are passed as an object to the second argument:

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

const apiHooks = ApiHooks.create(apiClient, {
  queryConfig: {
    caching: {
      staleIfOlderThan: 10000,
    },
  }
})
```

---

## Configuring API Hooks - Endpoint level settings

Endpoint level settings are applied by creating an "endpoint settings factory function" and passing it to the `hookConfigFactory` property on the config of `create`. It should look like this:

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

// this factory function can be in a different file for readability
const myEndpointConfig: ApiHooks.HookConfigLibraryFactory<typeof apiClient> = (emptyConfig) => {
  const endpointSettings = { ...emptyConfig }

  // simply add a block like this for each endpoint you'd like to add settings to
  endpointSettings.firstController.getEndpoint.query = {
    caching: {
      staleIfOlderThan: 10000
    }
  }

  return endpointSettings
}

const apiHooks = ApiHooks.create(apiClient, {
  // pass your factory to the hookConfigFactory property
  hookConfigFactory: myEndpointConfig
})
```

---

## Configuring API Hooks - Hook Level Settings

Hook level settings are simply passed into the hook at the point that it's being used, for example:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const [{data, isFetching}] = apiHooks.firstController.getEndpoint.useQuery({
    caching: {
      staleIfOlderThan: 10000
    }
  });

}
```

---

## Quirks - Auto invoke held for cache key parameter

It's often the case that a `useQuery` might need to `autoInvoke` in some cases and not others. As an example, say you're righting a user create/edit form, in "edit" mode, you'll need to query the existing user to edit, but in "create" mode, there's no query to run.

In this case, you might think you'd need a pattern like this:

```TypeScript
/* THE HARD WAY OF DOING IT */
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent<{ userId?: string }> = (props) => {

  const [{data, isFetching}, getUserFetch] = apiHooks.users.getUser.useQuery({
    autoInvoke: false,
    cacheKey: 'userId'
  });

  React.useEffect(() => {
    if(props.userId) {
      getUserFetch({userId: props.userId})
    }
  }, [props.userId])

}
```

This will work perfectly well, but it's a lot of faff. API Hooks has a hidden feature that will help you here:

**If the parameter being used as the `cacheKey` is null or undefined, `autoInvoke` will _not_ run on component load, but the query will run as soon as the parameter _becomes_ defined.**

So with that in mind, the above could just as easily be written like this:

```TypeScript
/* THE EASY WAY OF DOING IT */
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent<{ userId?: string }> = (props) => {

  // because "userId" is the cache key, the request will be "held" automatically if our prop isn't there.
  const [{data, isFetching}] = apiHooks.users.getUser.useQuery({
    cacheKey: 'userId',
    parameters: { userId: props.userId }
  });
}
```

NOTE: If you really need to turn this functionality off, you can do this at any level via a query setting called `holdInvokeForCacheKeyParam`. (set it to `false`.)

---

## Testing - Mock endpoints

For testing or developing purposes, it's sometimes helpful to bypass the API and return some "canned" data instead. With API Hooks, you can override the fetch method in your API client without needing to make any changes at component level. Here's how it's done:

A library of mock endpoints can be created in a similar way to endpoint level config, using a factory function:

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

// this factory function can be in a different file for readability
const myMockEndpoints: ApiHooks.MockEndpointLibraryFactory<typeof apiClient> = (emptyLibrary) => {
  const mockEndpoints = { ...emptyLibrary }

  // simply add a block like this for each endpoint you'd like to mock
  mockEndpoints.exampleQueries.getUser = async (params, testKeys) => {
    return {
      id: params.id,
      email: "example.user@example.com",
      firstName: "Example",
      lastName: "User",
    }
  }

  return mockEndpoints
}

const apiHooks = ApiHooks.create(apiClient, {
  // pass your factory to the mockEndpointFactory property
  mockEndpointFactory: myMockEndpoints
})
```

When the "mock endpoints" feature is active, the endpoints you define in this way will be called in place of the real endpoint in your API Client. The mock endpoint will be sent the parameters used with the API Hooks that has triggered the request, these parameters can then be used in the canned response as shown above.

There are two ways to activate the "mock endpoints" feature:

### 1. The global setting

Via a setting in both query config and mutation config called `useMockEndpoints`. This can be set at application, endpoint or hook level, depending on your needs. NOTE: This setting should _always_ be false in a production environment

### 2. Using "test keys"

If you're using an automated testing library, you can also activate mock endpoints by passing a dictionary of test keys into the API Hooks provider. A test key is a string associated with a specific endpoint, this string will be passed to the mock endpoint as the second argument (after the parameters) and can be used to customize the response from the mock endpoint based on the test that's being executed.

Here's an example:

```TypeScript
/**
  * This object will likely be created inside an automated test
  * and passed into the app render dynamically
  */
const testKeys: ApiHooksStore.TestKeyState = {
  [endpointIds.exampleQueries.getUserList().endpointHash]: { testKey: "UserScreenTest" },
  [endpointIds.exampleQueries.getUser().endpointHash]: { testKey: "UserScreenTest" },
}

return (
  <ApiHooksStore.Provider testKeys={testKeys}>
    {/* my app... */}
  </ApiHooksStore.Provider>
)
```

The presence of the `testKeys` prop will inform API Hooks that we're in an automated test environment, and mock endpoints will be activated for the entire application preventing the real API from being used. In the above example, the `UserScreenTest` key will then be passed to the associated mock endpoints like this:

```TypeScript
mockEndpoints.exampleQueries.getUser = async (params, testKey) => {
  switch(testKey) {
    case "UserScreenTest":
      return {
        ...
      }
  }
}
```

---

## Advanced features - Refetch Queries

Because the results of `useQuery` are cached, it's often necessary to make sure cached data doesn't hang around once we _know_ it's been changed, like after a `useMutation` for example. API Hooks has a dedicated solution for managing this called `refetchQueries`.

Here are some examples:

### Endpoint level refetch - "Whenever I create/update a user, I want to make sure my user cache is up to date"

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

1. Whenever `updateUser` successfully runs from a `useMutation` hook, all cache associated with the `getUserList` query will be invalidated, and so will all cache stored by `getUser` with a `cacheKey` that matches the `id` parameter sent to the `updateUser` mutation. To explain this further, if user `24` is updated for example, then all cache associated with user `24` will be invalidated, but cache stored by `getUser` relating to other user IDs will remain unaffected.
2. Whenever `addUser` successfully runs from a `useMutation` hook, all cache associated with the `getUserList` will be invalidated.

NOTE:

- What does it mean when we say cache is "invalidated"? If there is a component rendered with a `useQuery` referencing the invalidated cache, then a new request for the data will fire immediately once the associated mutation is successful. If there is _not_ a component rendered with a `useQuery` referencing the invalidated cache, then any stored cache will simply be marked as invalid so that a new request will be fired in the event that a `useQuery` is mounted that references it.
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

---

## Advanced features - Default Data

Sometimes it's useful to supply a `useQuery` hook with data to show on the first render of the app, before any requests are made to the server. This is particularly useful for isomorphic applications that are rendered synchronously on the server using data that has already been retrieved.

API Hooks provides two ways of achieving this:



# ... To be continued...
