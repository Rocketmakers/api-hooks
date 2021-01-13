import * as React from "react"
import { apiHooks } from "../../state/apiHooks"

import "./home.scss"

export const Home: React.FC = () => {
  const [{ isFetching, data }] = apiHooks.exampleQueries.getUserList.useQuery()

  return (
    <div className="home">
      <h2>User Table</h2>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email Address</th>
          </tr>
        </thead>
        {!!data?.length && (
          <tbody>
            {data.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}