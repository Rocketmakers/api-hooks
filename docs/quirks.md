## Quirks

This section documents some of the "under the hood" processes that API Hooks uses to make request and cache management simpler for a consuming application.

### Auto invoke held for cache key parameter

It's often the case that a [useQuery](hooks.md#usequery) might need to `autoInvoke` in some cases and not others. As an example, say you're righting a user create/edit form, in "edit" mode, you'll need to query the existing user to edit, but in "create" mode, there's no query to run.

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

This will work perfectly well, but it's a lot of faff. API Hooks can will help you here:

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

NOTE:
- If you really need to turn this functionality off, you can do this at any level via a query setting called `holdInvokeForCacheKeyParam`. (set it to `false`.)
- Unfortunately, this functionality can only work if a parameter key is specified as the cache key. If, on the other hand, your cache key is generated from a function, you'll need to hold the invoke manually as specified in the first example. Or alternatively, return `undefined` from your cache key generation function when an essential parameter isn't supplied.

[Back to Index](../README.md)