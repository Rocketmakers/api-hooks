import { ApiHooksEvents } from "@rocketmakers/api-hooks"
import * as React from "react"
import { Route } from "react-router-dom"
import { Home } from "./views/home/home"

export const Shell: React.FC = () => {

  return (
    <div className="shell">
      <h1>API Hooks Playground</h1>
      <hr />
      <Route path="/" component={Home} />
    </div>
  )
}
