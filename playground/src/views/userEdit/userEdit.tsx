import { Form, TextInput, Button, useDispatchToast, EmailInput } from "@rocketmakers/armstrong-edge"
import * as React from "react"
import { useParams } from "react-router-dom"
import { MemoryServer } from "../../servers/memory"
import { apiHooks } from "../../state/apiHooks"

export const UserEdit: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()

  const dispatch = useDispatchToast()

  const [{ data }] = apiHooks.user.getUser.useQuery({ parameters: { id: userId! } })

  const [addUser, { isFetching: adding }] = apiHooks.user.addUser.useMutation()
  const [updateUser, { isFetching: updating }] = apiHooks.user.updateUser.useMutation()
  const [deleteUser, { isFetching: deleting }] = apiHooks.user.deleteUser.useMutation()

  const { formProp, formState } = Form.use<MemoryServer.IUser>(
    data ?? {
      email: "",
      firstName: "",
      id: "",
      lastName: "",
    }
  )

  const onSubmitClick = React.useCallback(async () => {
    try {
      if (userId) {
        const { id, ...formData } = formState!
        await updateUser({ id, data: formData })
      } else {
        await addUser({ data: formState })
      }
      dispatch({ type: "success", content: `User ${formState!.id ? "updated" : "created"} successfully` })
    } catch (e: any) {
      const error = typeof e === "string" ? e : e.message ?? "Unknown error"
      dispatch({ type: "error", content: `Error occurred: ${error}` })
    }
  }, [formState, addUser, updateUser, userId])

  const onDeleteClick = React.useCallback(async () => {
    await deleteUser({ id: userId })
  }, [deleteUser])

  const mutating = adding || updating

  return (
    <form>
      <TextInput placeholder="First Name" bind={formProp("firstName").bind()} />
      <TextInput placeholder="Last Name" bind={formProp("lastName").bind()} />
      <EmailInput placeholder="Email" bind={formProp("email").bind()} />
      <Button pending={mutating} onClick={onSubmitClick}>
        Submit
      </Button>
      {!!userId && (
        <Button pending={deleting} onClick={onDeleteClick}>
          Delete
        </Button>
      )}
    </form>
  )
}
