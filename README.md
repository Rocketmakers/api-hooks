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
import { APIHooksStore } from "@rocketmakers/api-hooks"
import { AppComponent } from "*Root app component location*"

ReactDOM.render(
  <APIHooksStore.Provider>
    <AppComponent />
  </APIHooksStore.Provider>,
  document.getElementById("host"))
)
```

Getting the core hook library up and running is as simple as calling the `create` method and passing an API Client object (described above):

```TypeScript
import { APIHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

const apiHooks = APIHooks.create(apiClient)
```

The `apiHooks` constant above now contains a library of React hooks contained within an object structure that matches the controller/endpoint structure of your API Client.

---

## The Hooks

The library consists of three hooks that offer different interactions with your API. Each hook can be accessed by navigating through the controller and endpoint structure of your API client, using the result of the API Hooks `create` method as a starting point.

For example, if you stored the result of the `create` method in a constant called `apiHooks`, like the above example, that constant can now be imported and used in any component, as long as that component is rendered anywhere within the `APIHooksStore.Provider` component:

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

## Chaining two mutations, using a property of the response from A to call B.

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

## Configuring API Hooks - Application Level Settings

Application level settings are passed into the `create` method used to initialize the API Hooks library, they are passed as an object to the second argument:

```TypeScript
import { APIHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "*API CLient location*"

const apiHooks = APIHooks.create(apiClient, {
  queryConfig: {
    caching: {
      staleIfOlderThan: 10000,
    },
  }
})
```

## Configuring API Hooks - Endpoint level settings

Endpoint level settings are applied by creating an "endpoint settings factory function" and passing it to the `hookConfigFactory` property on the config of `create`. It should look like this:

```TypeScript
import { APIHooks } from "@rocketmakers/api-hooks"
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

const apiHooks = APIHooks.create(apiClient, {
  // pass your factory to the hookConfigFactory property
  hookConfigFactory: myEndpointConfig
})
```

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

**If the parameter being used as the `cacheKey` is null or undefined, `autoInvoke` will *not* run on component load, but the query will run as soon as the parameter *becomes* defined.**

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

## Advanced Features - Testing - Mock endpoints


# ... To be continued...
