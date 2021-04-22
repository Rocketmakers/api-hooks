import { ApiHooks } from "@rocketmakers/api-hooks"
import { IFormValidationResult, useToast } from "@rocketmakers/armstrong"
import * as React from "react"

interface ProcessingResponse {
  validationErrors: { key: string; message: string }[]
}

export const processingHook: ApiHooks.ProcessingHook<ProcessingResponse> = ({ hookType, fetchingMode, data, error, settings }) => {
  // armstrong toast
  const { dispatch } = useToast()

  // validation errors
  const validationErrors = React.useMemo<ProcessingResponse["validationErrors"]>(() => {
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

  return { validationErrors }
}
