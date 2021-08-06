import * as React from "react"
import { ApiHooks, ApiHooksResponders, EndpointIDs } from "@rocketmakers/api-hooks"
import { apiClient } from "../api/apiClient"
import { Toast, useToast } from "@rocketmakers/armstrong"
import { endpointMapFactory } from "./endpointMap"
import { processingHook } from "./processingHook"
import { MemoryServer } from "../servers/memory"

interface IFetchApiResponse<T> {
  data?: T
  error?: {
    status: number
    payload: any
  }
}

export const apiHooks = ApiHooks.create(apiClient, {
  generalConfig: {
    debugMode: true,
  },
  processingHook,
  hookConfigFactory: endpointMapFactory,
})

export const responders = ApiHooksResponders.createFactory(apiClient)
