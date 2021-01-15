import { ApiHooks, EndpointIDs } from "@rocketmakers/api-hooks"
import { apiClient as notifyClient } from "../api/apiClient"
import { apiClient as authClient } from "../api/apiClient"




export const apiHooks = ApiHooks.createMulti({
  auth: authClient,
  notify: notifyClient,
}, {
  generalConfig: {
    debugMode: true
  }
})