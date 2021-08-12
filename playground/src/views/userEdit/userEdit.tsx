import { useForm, TextInput, Button, useToast } from "@rocketmakers/armstrong"
import * as React from "react"
import { useParams } from "react-router-dom"
import { apiHooks } from "../../state/apiHooks"

export const UserEdit: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()

  const { dispatch } = useToast()

  const [{ data }] = apiHooks.user.getUser.useQuery({ parameters: { id: userId } })

  const [addUser, { isFetching: adding }] = apiHooks.user.addUser.useMutation()
  const [updateUser, { isFetching: updating }] = apiHooks.user.updateUser.useMutation()
  const [deleteUser, { isFetching: deleting }] = apiHooks.user.deleteUser.useMutation()

  const { bind, DataForm, dataBinder } = useForm<typeof data>(
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
        const { id, ...formData } = dataBinder.toJson()
        await updateUser({ id, data: formData })
      } else {
        await addUser({ data: dataBinder.toJson() })
      }
      dispatch({ type: "success", message: `User ${data.id ? "updated" : "created"} successfully` })
    } catch (e) {
      const error = typeof e === "string" ? e : e.message ?? "Unknown error"
      dispatch({ type: "error", message: `Error occurred: ${error}` })
    }
  }, [dataBinder, addUser, updateUser, userId])

  const onDeleteClick = React.useCallback(async () => {
    await deleteUser({ id: userId })
  }, [deleteUser])

  const mutating = adding || updating

  return (
    <DataForm>
      <TextInput label="First Name" {...bind.text("firstName")} />
      <TextInput label="Last Name" {...bind.text("lastName")} />
      <TextInput label="Email" {...bind.textEmail("email")} />
      <Button pending={mutating} onClick={onSubmitClick}>
        Submit
      </Button>
      {
        !!userId &&
        <Button pending={deleting} onClick={onDeleteClick}>
          Delete
        </Button>
      }
    </DataForm>
  )
}
