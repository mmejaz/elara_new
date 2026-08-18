import { LogoutOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useAppSelector } from '../store/hooks'
import { useStopImpersonating } from '../modules/users/queries'
import { toast } from '../utils/toast'
import { serverMessage } from '../utils/formErrors'

/**
 * App-wide bar shown while a Super Admin is viewing the app AS another user.
 * Always visible (rendered above the layout) so the "return to your account"
 * escape hatch is one click away from any page.
 */
function ImpersonationBanner() {
  const impersonation = useAppSelector((state) => state.auth.impersonation)
  const viewingAs = useAppSelector((state) => state.auth.user?.name)
  const stop = useStopImpersonating()

  if (!impersonation.active) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span className="inline-flex items-center gap-2">
        <UserSwitchOutlined />
        You are viewing the app as <strong>{viewingAs}</strong>
        {impersonation.impersonator ? <> — signed in as {impersonation.impersonator}</> : null}
      </span>
      <Button
        size="small"
        icon={<LogoutOutlined />}
        loading={stop.isPending}
        onClick={() =>
          stop.mutate(undefined, {
            onSuccess: () => toast.success('Returned to your account.'),
            onError: (error) => toast.error(serverMessage(error, 'Unable to return to your account')),
          })
        }
      >
        Return to your account
      </Button>
    </div>
  )
}

export default ImpersonationBanner
