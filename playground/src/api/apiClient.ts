import { MemoryServer } from "../servers/memory"
import { delay } from "../utils/delay"

const defaultDelay = 1000

type AddTestArgs<TArgs = {}> = TArgs & {
  requestDelay?: number
  throwServerError?: boolean
}

async function processTestArgs<TArgs = {}>(args: AddTestArgs<TArgs>) {
  await delay(args.requestDelay ?? defaultDelay)
  if (args.throwServerError) {
    throw new Error("An unexpected error occurred")
  }
}



class Users {
  // gets a list of all the users in the system
  getUserList = async (args: AddTestArgs) => {
    await processTestArgs(args)
    return MemoryServer.getUsers()
  }
  // gets a single user by ID.
  getUser = async (args: AddTestArgs<{ id: string }>) => {
    await processTestArgs(args)
    return MemoryServer.getUser(args.id)
  }
  // creates a new user
  addUser = async (args: AddTestArgs<{ data: Omit<MemoryServer.IUser, "id"> }>) => {
    await processTestArgs(args)
    return MemoryServer.addUser(args.data)
  }
  // updates an existing user's data by ID.
  updateUser = async (args: AddTestArgs<{ id: string; data: Partial<Omit<MemoryServer.IUser, "id">> }>) => {
    await processTestArgs(args)
    return MemoryServer.updateUser(args.id, args.data)
  }
  // removes a user from the system by ID.
  deleteUser = async (args: AddTestArgs<{ id: string }>) => {
    await processTestArgs(args)
    return MemoryServer.deleteUser(args.id)
  }
  // receives a query string, and returns a list of matching users.
  searchUser = async (args: AddTestArgs<{ search: string }>) => {
    await processTestArgs(args)
    return MemoryServer.searchUsers(args.search)
  }
}



class ApiClient {
  user = new Users()
}

export const apiClient = new ApiClient()
