import { ApiHooksEvents } from "@rocketmakers/api-hooks"

ApiHooksEvents.onFetchStart.addEventHook((endpointID, hookType) => {
  console.log("FETCH START", endpointID, hookType)
})
ApiHooksEvents.onFetchSuccess.addEventHook((endpointID, hookType, response) => {
  console.log("FETCH SUCCESS", endpointID, hookType, response)
})
ApiHooksEvents.onFetchError.addEventHook((endpointID, hookType, error) => {
  console.log("FETCH FAIL", endpointID, hookType, error)
})
