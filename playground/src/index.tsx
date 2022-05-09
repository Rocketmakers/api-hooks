import * as React from "react"
import { createRoot } from "react-dom/client"
import { ApiHooksEvents, ApiHooksResponders, ApiHooksStore } from "@rocketmakers/api-hooks"
import { HashRouter } from "react-router-dom"
import { ToastProvider, ModalProvider } from "@rocketmakers/armstrong-edge"
import { Shell } from "./shell"
import { userResponder } from "./state/responders/users"

import "./logs"

import "./theme/theme.scss"

// ApiHooksEvents.onBeforeInitialState.addEventHook(() => {
//   return JSON.parse(localStorage.getItem("my-data-store") ?? "{}")
// })

// ApiHooksEvents.onStateUpdated.addEventHook((state) => {
//   localStorage.setItem("my-data-store", JSON.stringify(state))
// })

// Hack to get around lack of React 18 support in Armstrong Edge
const ToastProviderFixed = ToastProvider as any

class App extends React.Component {
  componentDidCatch() {
    console.error("TODO - handle error")
  }

  render() {
    return (
      <ApiHooksStore.Provider>
        <ToastProviderFixed>
          <ModalProvider>
            <ApiHooksResponders.Provider responders={[userResponder]}>
              <HashRouter>
                <Shell />
              </HashRouter>
            </ApiHooksResponders.Provider>
          </ModalProvider>
        </ToastProviderFixed>
      </ApiHooksStore.Provider>
    )
  }
}

function render() {
  const rootElementId = "root"
  const container = document.getElementById(rootElementId)
  if (!container) {
    throw new Error(`Root element ${rootElementId} not found in page`)
  }
  const root = createRoot(container)
  root.render(
    <App />
  )
}

render()
