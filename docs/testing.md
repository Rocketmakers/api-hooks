## Testing with Mock endpoints

For testing or developing purposes, it's sometimes helpful to bypass the API and return some "canned" data instead. With API Hooks, you can override the fetch method in your API client without needing to make any changes at component level. Here's how it's done:

A library of mock endpoints can be created in a similar way to endpoint level config, using a factory function:

```TypeScript
import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "path/to/my/apiclient"

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

[Back to Index](../README.md)