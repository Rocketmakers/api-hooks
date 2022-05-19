# API Hooks

A front-end library for converting a REST API client into a library of useful React hooks for fetching, caching and displaying external data. The library is written in TypeScript and compiled to a JavaScript node module and accompanying typings.

## Prerequisite Libraries

```
React (17+)
```

## Contents

* [Setting Up Your API Client](#setting-up-your-api-client)
* [Adding API Hooks to your project](#adding-api-hooks-to-your-project)
* [The Hooks](docs/hooks.md)
  * [useQuery _(GET)_](docs/hooks.md#usequery-get)
  * [useMutation _(POST/PUT/PATCH/DELETE)_](docs/hooks.md#usemutation-postputpatchdelete)
  * [useRequest](docs/hooks.md#userequest)
  * [useTools](docs/hooks.md#usetools)
* [Configuring API Hooks](docs/config.md)
  * [Application Level Settings](docs/config.md#application-level-settings)
  * [Endpoint Level Settings](docs/config.md#endpoint-level-settings)
  * [Hook Level Settings](docs/config.md#hook-level-settings)
* [Caching](docs/caching.md)
  * [Cache Keys](docs/caching.md#cache-keys---structuring-the-state)
  * [Refetch Queries](docs/caching.md#refetch-queries---keeping-the-state-valid)
  * [Cache Config](docs/caching.md#cache-config---optimizing-the-state)
  * [Cache Quirks](docs/caching.md#caching-quirks---auto-invoke-held-for-cache-key-parameter)
* [Testing with Mock Endpoints](docs/testing.md)
  * [Test Keys](docs/testing.md#2-using-"test-keys")
* [Advanced Features](docs/advanced.md)
  * [The Processing Hook](docs/advanced.md#the-processing-hook)
  * [Lifecycle Listeners](docs/advanced.md#lifecycle-listeners)
  * [Global Listeners](docs/advanced.md#global-listeners)
  * [Responders](docs/advanced.md#responders)
  * [Default Data](docs/advanced.md#default-data)
  * [Payload Modifiers](docs/advanced.md#payload-modifiers)
  * [Bookmark Parameters](docs/advanced.md#bookmark-parameters)
* [Debugging](docs/debugging.md)

## Setting Up Your API Client

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

NOTE: It's essential that each endpoint receives a **single parameter** which must be an **object of key/value parameters**. This is required for semantic reasons. It allows the API client author to name the parameters sent to an endpoint, this makes the commands sent to API Hooks much easier to read.

---

## Adding API Hooks to your project

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
import { apiClient } from "path/to/my/apiclient"

export const apiHooks = ApiHooks.create(apiClient)
export const endpointIds = EndpointIDs.create(apiClient)

```

The `apiHooks` constant above now contains a library of React hooks contained within an object structure that matches the controller/endpoint structure of your API Client.

NOTE: The `endpointIds` constant is a library of strictly types identifiers designed for use with some of API Hooks' more advanced features (such as [mock endpoints](docs/testing.md#testing-with-mock-endpoints) and [refetch queries](docs/caching.md#refetch-queries---keeping-the-state-valid).) It's not required for the basic hooks to work, so feel free to add it later if/when you need it.