import * as React from "react"
import { ApiHooks, ApiHooksResponders, EndpointIDs } from "@rocketmakers/api-hooks"
import { apiClient } from "../api/apiClient"
import { Toast, useToast } from "@rocketmakers/armstrong"
import { endpointMapFactory } from "./endpointMap"
import { processingHook } from "./processingHook"

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

const responders = ApiHooksResponders.createFactory(apiClient)

responders.use(({ useListener }) => {
  const [{ data: myData }] = apiHooks.user.getUserList.useQuery()

  useListener("user", "getUser").query((data) => {
    const listAccessor = accessor("user", "getUserList")
    const listCache = listAccessor.get()
    if (listCache) {
      listAccessor.set(listCache.map((u) => (u.id === data.id ? data : u)))
    }
  })

  accessor("user", "deleteUser").useListener((data, cacheKey, params) => {
    const listAccessor = accessor("user", "getUserList")
    const listCache = listAccessor.get()
    if (listCache?.find((u) => u.id === params.id)) {
      listAccessor.set(listCache.filter((u) => u.id !== params.id))
    }
  })

  accessor("user", "addUser").useListener((data, cacheK) => {})
})
