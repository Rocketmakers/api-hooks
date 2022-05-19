## Debugging

API Hooks uses detailed in-browser console logs when the debugging function is enabled. This surfaces the flow of your API Hooks environment with event driven logging, allowing you to see exactly what's happening within the lifecycle.

### Set the API Hooks instance to debug mode

Debug mode is enabled in the `generalConfig` when your API Hooks instance is created:
```TypeScript
export const apiHooks = ApiHooks.create(apiClient, {
  generalConfig: {
    debugMode: true,
  }
});
```

### There's too much console noise! I can't see what I'm looking for.

Often, in a single page application, a lot of API requests are made for a single page load. When you're trying to debug a single use of an API hook it can be hard to see the wood for the trees. This can be resolved by adding a `debugKey` to the hook instance that you're trying to track:
```TypeScript
const [{ data }] = apiHooks.user.getUser.useQuery({ parameters: { id: userId! }, debugKey: 'why?' })
```
This string will now be added to every console log relating to this specific hook instance when `debugMode` is set to true. The browser's console search filter can then be used to show only the logs relating to a specific debug key.

[Back to Index](../README.md)