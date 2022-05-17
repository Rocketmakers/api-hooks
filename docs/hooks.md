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

### useQuery _(GET)_

The `useQuery` hook is your primary data fetcher, and will usually be used exclusively with `GET` requests. Here are some of the core features:

- "Live" query parameters - meaning data will be automatically re-fetched when parameters change.
- A time-based caching system - stored per endpoint, and by a unique `cacheKey` property.
- Requests can be triggered automatically or manually.

Here are some typical examples:

#### A list of users, fetched on component mount and rendered:

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

#### An individual user, fetched on component mount:

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

#### A manual fetch, triggered by a button:

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

### useMutation _(POST/PUT/PATCH/DELETE)_

The `useMutation` hook is your primary data editor, and will usually be used with `POST`, `PUT` and `DELETE` requests. Here are some of the core features:

- The response is returned in a promise by the invoke function, and also from the hook as a live response.
- Unlike [useQuery](hooks.md#usequery), responses from `useMutation` are _not_ cached globally.
- Unlike [useQuery](hooks.md#usequery), mutations are _never_ invoked automatically, and _must_ be invoked via the function returned from the hook.

Here are some typical examples:

#### Create a new user

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
- Mutations will throw errors by default, so make sure all awaited mutation calls are wrapped in a try/catch block. If you're prefer that errors are returned to the hook's state object rather than being thrown, this can be achieved by setting the `throwErrors` setting to `false` in the mutation config.

#### Chaining two mutations, using a property of the response from A to call B.

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

### useRequest

The `useRequest` hook is the simplest, and will likely be by far the least used hook in your application. It's designed to be used with `GET` requests that provide "look up" data for things like searches and autocomplete inputs, and therefore don't need to be cached or provide a data response from the hook.

Here are some typical examples:

#### Populating a list of selectable users as the user types:

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

- A [useQuery](hooks.md#usequery) would have worked here, and may have been more appropriate. `useRequest` exists as a way of accessing your API fetch methods in a way that bypasses most of the API Hooks functionality, kind of a "manual override."
- Unlike the other two hooks, the `useRequest` hook doesn't return an array for de-structuring. This is because the response is completely unprocessed, it only returns a function for accessing the raw API fetch method.

---

### useTools

The `useTools` hook merely returns a library of endpoint specific tools which can be useful for some of the more advanced aspects of state management. At the moment, this library only contains one function (`refetchAllQueries`), but more useful stuff will be added soon!

#### `refetchAllQueries`

The `refetchAllQueries` method allows for cached data to be invalidated and live data to be re-fetched against any number of endpoint cache keys simultaneously. Say, for example, we have a `getUser` query which returns a single user and therefore uses the `id` as a cache key. But we also offer the user a "Refresh Users" button which allows them to manually re-request the data for all users.

The "Refresh Users" button might look like this:

##### Refreshing all users:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const { refetchAllQueries } = apiHooks.users.getUser.useTools()

  return (
    <button onClick={() => refetchAllQueries()}>Refresh Users</button>
  )
}
```
The above will log a refresh request against all cache keys associated with the `getUser` endpoint. Any instances that are mounted on screen will refresh immediately, and any cache that is not currently used by a mounted component will be invalidated, forcing a re-fetch the next time it is requested. (This behaviour is the same as refetch queries [below](#advanced-refetch-query-management).)

For more flexibility, an object can be passed to `refetchAllQueries` specifying alternative parameters to be used with any immediate refetch, if not passed, the last used parameters will be re-sent. Alternatively, an array of object can also be passed allowing this function to re-fetch on **specific cache keys only**.

##### Refreshing user list - overriding a single parameter to reset paging on a list:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FunctionComponent = () => {

  const { refetchAllQueries } = apiHooks.users.getUsers.useTools()

  return (
    <button onClick={() => refetchAllQueries({ params: { page: 1 }, paramOverrideMode: 'merge' })}>
      Refresh User List
    </button>
  )
}
```

##### Refreshing users - only on two specific cache keys:

```TypeScript
import { apiHooks } from "*create method location*"

const MyComponent: React.FC<{ idsToRefresh: string[] }> = ({ idsToRefresh }) => {

  const { refetchAllQueries } = apiHooks.users.getUsers.useTools()

  return (
    <button onClick={() => refetchAllQueries(idsToRefresh.map(i => ({ cacheKeyValue: i })))}>
      Refresh User List
    </button>
  )
}
```

[Back to Index](../README.md)