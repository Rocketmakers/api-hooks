import { Button } from '@rocketmakers/armstrong-edge'
import { apiHooks } from '../mock/state/apiHooks';
import { createMeta } from '../_test/storybook/utils';

export const Default = () => {
  const [{ isFetching, data, fetchingMode }, refetch] = apiHooks.user.getUserList.useQuery({
    parameters: {
      requestDelay: 1000
    }
  });

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
      <Button pending={isFetching && fetchingMode === 'manual'} onClick={() => refetch()}>Refetch</Button>
    </div>
  );
};

export default createMeta(Default, 'Hooks', 'useQuery', {}, true);
