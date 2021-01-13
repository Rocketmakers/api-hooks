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

class ExampleQueries {
  getUserList = async (args: AddTestArgs) => {
    await processTestArgs(args)
    return MemoryServer.getUsers()
  }
  getUser = async (args: AddTestArgs<{ id: string }>) => {
    await processTestArgs(args)
    return MemoryServer.getUser(args.id)
  }
}

class ExampleMutations {
  addUser = async (args: AddTestArgs<{ data: Omit<MemoryServer.IUser, "id"> }>) => {
    await processTestArgs(args)
    return MemoryServer.addUser(args.data)
  }
  updateUser = async (args: AddTestArgs<{ id: string; data: Partial<Omit<MemoryServer.IUser, "id">> }>) => {
    await processTestArgs(args)
    return MemoryServer.updateUser(args.id, args.data)
  }
}

class ExampleRequests {
  searchUser = async (args: AddTestArgs<{ search: string }>) => {
    await processTestArgs(args)
    return MemoryServer.searchUsers(args.search)
  }
}

class ApiClient {
  exampleQueries = new ExampleQueries()
  exampleMutations = new ExampleMutations()
  exampleRequests = new ExampleRequests()
}

export const apiClient = new ApiClient()
