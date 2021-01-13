class FirstController {
  getEndpoint = (args: { arg1?: string; arg2?: number }): Promise<string> => {
    return Promise.resolve("hello world")
  }
  // add additional endpoints to controller here
}

class ApiClient {
  firstController = new FirstController()
  // add additional controllers here
}

export const apiClient = new ApiClient()
