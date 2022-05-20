import { UUIDService } from '../services/uuid';

export namespace MemoryServer {
  export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }

  let users: IUser[] = [
    {
      id: 'cb6471de-51c0-44d3-8c88-8c2be94ddee0',
      firstName: 'Poornima',
      lastName: 'Ardith',
      email: 'poornima.ardith@example.com',
    },
    {
      id: '809db8b9-b7aa-400c-9894-7a64d1e9274f',
      firstName: 'İkbal',
      lastName: 'Bogdan',
      email: 'i̇kbal.bogdan@example.com',
    },
    {
      id: '032b1d2c-5ea4-48d6-b86d-35c535cce5a2',
      firstName: 'Lonny',
      lastName: 'Aisyah',
      email: 'lonny.aisyah@example.com',
    },
    {
      id: '753c68e8-95cc-4f18-a965-0b76bdbd481d',
      firstName: 'Vito',
      lastName: 'Seong-Jin',
      email: 'vito.seong-jin@example.com',
    },
    {
      id: '5c4bbc93-9f93-46ba-b3f1-2eb1dd656d76',
      firstName: 'Emanuel',
      lastName: 'Aksinia',
      email: 'emanuel.aksinia@example.com',
    },
  ];

  export function getUsers(): IUser[] {
    return users;
  }

  export function getUser(id: string): IUser {
    const user = users.filter((u) => u.id === id);
    if (user.length === 1) {
      return user[0];
    }
    throw new Error(`User not found with ID ${id}`);
  }

  export function searchUsers(search: string): IUser[] {
    const regex = new RegExp(search, 'gi');
    return users.filter((u) => regex.test(u.firstName) || regex.test(u.lastName) || regex.test(u.email));
  }

  export function deleteUser(id: string): void {
    const user = getUser(id);
    users = [...users.filter((u) => u.id !== user.id)];
  }

  export function updateUser(id: string, data: Partial<Omit<IUser, 'id'>>): IUser {
    let user = getUser(id);
    user = { ...user, ...data };
    users = users.map((u) => (u.id === id ? user : u));
    return user;
  }

  export function addUser(data: Omit<IUser, 'id'>): IUser {
    const newUser = { id: UUIDService.create(), ...data };
    users.push(newUser);
    return newUser;
  }
}
