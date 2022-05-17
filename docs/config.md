## Configuring API Hooks

With a few exceptions, the configuration options for API Hooks can be applied at three different levels, with individual settings "falling back" to the higher level if they have not been defined at the lower level. These levels are, from top to bottom:

1. `System Level` - The system level settings are applied by default and should not be changed directly, only overridden.
2. `Application Level` - Application level settings will override the system level settings and apply to the entire application unless overridden lower down.
3. `Endpoint Level` - Endpoint level settings will override the system and application level settings and apply to a single endpoint wherever it is used. (An "endpoint" in this definition means any function within a controller on your API Client, e.g. `firstController.getEndpoint`.)
4. `Hook Level` - Hook level settings will override the three previous levels, and apply to one instance of [useQuery](hooks.md#usequery), [useMutation](hooks.md#usemutation) or [useRequest](hooks.md#userequest) _only_.
5. `Fetch Level` - **some** settings (such as endpoint parameters) can be supplied when an invoke function is executed for one of the hooks. These settings will apply to that fetch only.

NOTE: Settings that can be overridden are split into separate areas for the three different hooks, `query`, `mutation` and `request`. The application level also has some other settings which can **only** be set for the entire application.

Let's take a single setting, in this case the `staleIfOlderThan` setting within the `caching` area of the `query` settings, and see how we apply a change at all of the different levels:

---

### Application Level Settings

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

### Endpoint level settings

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

### Hook Level Settings

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

[Back to Index](../README.md)