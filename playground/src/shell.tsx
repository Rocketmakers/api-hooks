import * as React from "react"
import { Route, Routes } from "react-router-dom"
import { Home } from "./views/home/home"
import { UserEdit } from "./views/userEdit/userEdit"

export const Shell: React.FC = () => {
  return (
    <div className="shell">
      <h1>API Hooks Playground</h1>
      <hr />
      <Routes>
        <Route path="/:userId" element={<UserEdit />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  )
}
