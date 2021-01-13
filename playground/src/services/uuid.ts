import { v4 } from "uuid"

export namespace UUIDService {
  export function create() {
    return v4()
  }
}
