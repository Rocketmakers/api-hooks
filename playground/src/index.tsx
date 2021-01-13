import * as React from "react"
import * as ReactDOM from "react-dom"
import { ApiHooksStore } from "@rocketmakers/api-hooks"
import { HashRouter } from "react-router-dom"
import { ArmstrongConfig, DialogProvider, ToastProvider } from "@rocketmakers/armstrong"
import { Shell } from "./shell"

import "./theme/theme.scss"

ArmstrongConfig.setLocale("en-gb")

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
