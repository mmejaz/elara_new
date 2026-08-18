import { Form, Input, Modal, Typography } from 'antd'
import { useEffect } from 'react'
import { useUpdateUserStatus } from '../queries'
import { toast } from '../../../utils/toast'
import { applyServerErrors, serverMessage } from '../../../utils/formErrors'
import type { User, UserStatus } from '../../../types/models'

interface Props {
  /** The user being deactivated/blocked; null when the modal is closed. */
  user: User | null
  /** The status to apply — only the reason-requiring ones open this modal. */
  status: Extract<UserStatus, 'deactivated' | 'blocked'> | null
  onClose: () => void
}

/**
 * Confirmation dialog for deactivating or blocking a user. Both actions REQUIRE
 * a reason (validated here and again on the server) before proceeding.
 */
function UserStatusModal({ user, status, onClose }: Props) {
  const [form] = Form.useForm<{ reason: string }>()
  const mutation = useUpdateUserStatus()
  const open = Boolean(user && status)
  const verb = status === 'blocked' ? 'Block' : 'Deactivate'

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleOk = () => {
    form
      .validateFields()
      .then(({ reason }) => {
        mutation.mutate(
          { id: user!.id, status: status!, reason },
          {
            onSuccess: () => {
              toast.success(`${user!.name} has been ${status}.`)
              onClose()
            },
            onError: (error) => {
              if (!applyServerErrors(error, form)) {
                toast.error(serverMessage(error, 'Unable to update status'))
              }
            },
          },
        )
      })
      .catch(() => {
        /* validation errors are shown inline */
      })
  }

  return (
    <Modal
      title={`${verb} ${user?.name ?? 'user'}`}
      open={open}
      okText={verb}
      okButtonProps={{ danger: true, loading: mutation.isPending }}
      cancelButtonProps={{ disabled: mutation.isPending }}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" className="!mb-3">
        {status === 'blocked'
          ? 'Blocked accounts cannot sign in. This is recorded with your reason.'
          : 'Deactivated accounts cannot sign in until reactivated. This is recorded with your reason.'}
      </Typography.Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please provide a reason' }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={1000}
            showCount
            autoFocus
            placeholder={`Why is this account being ${status === 'blocked' ? 'blocked' : 'deactivated'}?`}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserStatusModal
