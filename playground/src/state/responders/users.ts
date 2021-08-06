import { responders } from "../apiHooks"

/** create a new responder to manage the user flow */
export const userResponder = responders.use(({ useListener, setCache, getCache }) => {

  /** add a listener - this function will run whenever our `getUser` query responds meaning a user has been updated */
  useListener("user", "getUser").query(({ data }) => {
    /** make sure we have a successful response with data */
    if (data) {
      /** get the user list from cache */
      const listCache = getCache("user", "getUserList")
      /** is our updated user in the list? */
      if (listCache?.some((user) => (user.id = data.id))) {
        /** create an updated user list containing the changes made to our individual user */
        const updatedList = listCache.map((user) => (user.id === data.id ? data : user))
        /** store our new list in cache - this will re-render any components displaying the list automatically! */
        setCache("user", "getUserList", updatedList)
      }
    }
  })
})
