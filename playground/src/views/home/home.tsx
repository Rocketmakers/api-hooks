import * as React from "react"
import { Link } from "react-router-dom"
import { apiHooks } from "../../state/apiHooks"

export const Home: React.FC = () => {
  const [
    {
      isFetching,
      data,
      processed: { validationErrors },
    },
    ,
    manual,
  ] = apiHooks.user.getUserList.useQuery()

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
                <td>
                  <Link to={`/${user.id}`}>{user.firstName}</Link>
                </td>
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
