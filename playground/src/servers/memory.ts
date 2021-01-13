import { UUIDService } from "../services/uuid"

export namespace MemoryServer {
  export interface IUser {
    id: string
    firstName: string
    lastName: string
    email: string
  }

  let users: IUser[] = [
    { id: UUIDService.create(), firstName: "Poornima", lastName: "Ardith", email: "poornima.ardith@example.com" },
    { id: UUIDService.create(), firstName: "İkbal", lastName: "Bogdan", email: "i̇kbal.bogdan@example.com" },
    { id: UUIDService.create(), firstName: "Lonny", lastName: "Aisyah", email: "lonny.aisyah@example.com" },
    { id: UUIDService.create(), firstName: "Vito", lastName: "Seong-Jin", email: "vito.seong-jin@example.com" },
    { id: UUIDService.create(), firstName: "Emanuel", lastName: "Aksinia", email: "emanuel.aksinia@example.com" },
  ]

  export function getUsers(): IUser[] {
    return users
  }

  export function getUser(id: string): IUser {
    const user = users.filter((u) => u.id === id)
    if (user.length === 1) {
      return user[0]
    }
    throw new Error(`User not found with ID ${id}`)
  }

  export function searchUsers(search: string): IUser[] {
    const regex = new RegExp(search, "gi")
    return users.filter((u) => regex.test(u.firstName) || regex.test(u.lastName) || regex.test(u.email))
  }

  export function deleteUser(id: string): void {
    const user = getUser(id)
    users = [...users.filter((u) => u.id !== user.id)]
  }

  export function updateUser(id: string, data: Partial<Omit<IUser, "id">>): IUser {
    let user = getUser(id)
    user = { ...user, ...data }
    return user
  }

  export function addUser(data: Omit<IUser, "id">): IUser {
    const newUser = { id: UUIDService.create(), ...data }
    users.push(newUser)
    return newUser
  }
}
