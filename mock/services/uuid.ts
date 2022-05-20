export namespace UUIDService {
  export function create() {
    return new Date().getTime().toString();
  }
}
