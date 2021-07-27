import * as React from "react"
import * as ReactDOM from "react-dom"
import { ApiHooksEvents, ApiHooksStore } from "@rocketmakers/api-hooks"
import { HashRouter } from "react-router-dom"
import { ArmstrongConfig, DialogProvider, ToastProvider } from "@rocketmakers/armstrong"
import { Shell } from "./shell"

import "./logs"

import "./theme/theme.scss"

ArmstrongConfig.setLocale("en-gb")

// ApiHooksEvents.onBeforeInitialState.addEventHook(() => {
//   return JSON.parse(localStorage.getItem("my-data-store") ?? "{}")
// })

// ApiHooksEvents.onStateUpdated.addEventHook((state) => {
//   localStorage.setItem("my-data-store", JSON.stringify(state))
// })

class App extends React.Component {
  componentDidCatch() {
    console.error("TODO - handle error")
  }

  render() {
    return (
      <ApiHooksStore.Provider>
        <ToastProvider>
          <DialogProvider>
            <HashRouter>
              <Shell />
            </HashRouter>
          </DialogProvider>
        </ToastProvider>
      </ApiHooksStore.Provider>
    )
  }
}

ReactDOM.render(<App />, document.getElementById("host"))
