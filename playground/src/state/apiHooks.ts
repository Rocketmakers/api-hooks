import * as React from "react"
import { ApiHooks, EndpointIDs } from "@rocketmakers/api-hooks"
import { apiClient } from "../api/apiClient"
import { Toast, useToast } from "@rocketmakers/armstrong"
import { endpointMapFactory } from "./endpointMap"

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
  processingHook: (hookType, data?: IFetchApiResponse<any>) => {
    // armstrong toast
    const { dispatch } = useToast()

    // validation errors
    const validationErrors = React.useMemo<{ key: string; message: string }[]>(() => {
      if (hookType === "mutation" && data?.error?.status === 422) {
        return data.error.payload ?? []
      }
      return []
    }, [data, hookType])

    // server errors
    React.useEffect(() => {
      if (data?.error?.status === 500) {
        dispatch({ type: "error", message: data.error.payload ?? "Unexpected Error" })
      }
    }, [dispatch, data])

    return { validationErrors } // this will be returned from every useQuery and useMutation, strictly typed!
  },
  hookConfigFactory: endpointMapFactory
})

export const endpointIdentifiers = EndpointIDs.create(apiClient);
