import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "../api/apiClient"

export const apiHooks = ApiHooks.create(apiClient, {
  generalConfig: {
    debugMode: true,
  },
})
