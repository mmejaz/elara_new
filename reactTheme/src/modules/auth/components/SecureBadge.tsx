import { SafetyCertificateOutlined } from '@ant-design/icons'

/**
 * "Protected by Secure Sign-in" trust badge. Rendered identically at the foot of
 * both the Login and Forgot Password forms — kept here so the two can't drift.
 */
function SecureBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={
        'flex min-h-[36px] items-center justify-center rounded-lg px-3 text-center font-serif text-xs font-medium leading-snug ' +
        'bg-[#f3fbf7] text-[#145c3d] shadow-[0_6px_18px_rgba(20,92,61,0.06)] ' +
        'dark:bg-emerald-950/40 dark:text-emerald-300 dark:shadow-none ' +
        className
      }
    >
      <SafetyCertificateOutlined className="mr-2 shrink-0 text-base !text-[#18a058]" />
      <span>Protected by Secure Sign-in</span>
    </div>
  )
}

export default SecureBadge
