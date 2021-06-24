import * as React from "react"
import { Route, Switch } from "react-router-dom"
import { Home } from "./views/home/home"
import { UserEdit } from "./views/userEdit/userEdit"

export const Shell: React.FC = () => {
  return (
    <div className="shell">
      <h1>API Hooks Playground</h1>
      <hr />
      <Switch>
        <Route path="/:userId" component={UserEdit} />
        <Route path="/" component={Home} />
      </Switch>
    </div>
  )
}
