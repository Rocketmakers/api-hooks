import { ApiHooks } from "@rocketmakers/api-hooks"
import { useDispatchToast } from "@rocketmakers/armstrong-edge"
import * as React from "react"

interface ProcessingResponse {
  validationErrors: { key: string; message: string }[]
}

export const processingHook: ApiHooks.ProcessingHook<ProcessingResponse> = ({ hookType, fetchingMode, data, error, settings }) => {
  // armstrong toast
  const dispatch = useDispatchToast()

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
      dispatch({ type: "error", content: data.error.payload ?? "Unexpected Error" })
    }
  }, [dispatch, data])

  return { validationErrors }
}
