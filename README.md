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

# ... To be continued...
