import * as React from 'react';
import { Button, EmailInput, Form, TextInput } from '@rocketmakers/armstrong-edge';
import { MemoryServer } from '../mock/servers/memory';
import { apiHooks } from '../mock/state/apiHooks';
import { createMeta } from '../_test/storybook/utils';

const testUser = MemoryServer.getUsers()[0].id;

export const Default = () => {
  const [{ data }] = apiHooks.user.getUser.useQuery({
    parameters: {
      id: testUser,
    },
  });

  const [updateUser, { isFetching }] = apiHooks.user.updateUser.useMutation({
    parameters: {
      requestDelay: 1000,
    },
  });

  const { formProp, formState } = Form.use<MemoryServer.IUser>(
    data ?? {
      id: testUser,
      email: '',
      firstName: '',
      lastName: '',
    }
  );

  return (
    <div className="home">
      <TextInput bind={formProp('firstName').bind()} />
      <TextInput bind={formProp('lastName').bind()} />
      <EmailInput bind={formProp('email').bind()} />
      <Button pending={isFetching} onClick={() => updateUser({ id: testUser, data: formState })}>
        Update
      </Button>
    </div>
  );
};

export default createMeta(Default, 'Hooks', 'useMutation', {}, true);
