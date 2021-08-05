import { ApiHooks } from "@rocketmakers/api-hooks"
import { apiClient } from "../api/apiClient"
import { endpointIdentifiers } from "./endpointIds"

export const endpointMapFactory: ApiHooks.HookConfigLibraryFactory<typeof apiClient> = (emptyMap) => {
  const endpointMap = { ...emptyMap }

  /****************************
   * User controller mapping
   *****************************/

  // the "get user list" query returns a list rather than a single instance of a data type, it doesn't need a cache key.
  endpointMap.user.getUserList.query = {}

  // the "get user" query returns a single instance of a data type, the cache key should be the primary key.
  endpointMap.user.getUser.query = {
    cacheKey: "id",
  }

  // the "update user" mutation changes a user's data, so we need to make sure:
  // - our list reflects this
  // - our single user instance reflects this, but only for the cache key (id) that's been updated.
  endpointMap.user.updateUser.mutation = {
    refetchQueries: (settings) => {
      if (settings.parameters?.id) {
        return [endpointIdentifiers.user.getUser({ cacheKeyValue: settings.parameters?.id })]
      }
      return []
    },
  }

  return endpointMap
}
