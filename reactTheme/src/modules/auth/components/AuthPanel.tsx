import { Typography } from 'antd'
import type { MouseEventHandler, ReactNode } from 'react'
import loginBackground from '../../../assets/images/auth/login-background.png'

const { Paragraph, Title } = Typography

interface AuthPanelProps {
  children: ReactNode
  footerAction?: MouseEventHandler<HTMLElement>
  footerActionText?: string
  footerText?: string
  subtitle?: ReactNode
  title?: ReactNode
}

/**
 * Split-panel auth shell (faithful port of the reference design): a full-bleed
 * background image with a bordered card — a quote/hero on the left and the form
 * (passed as `children`) on the right. Used by Login and Forgot Password.
 */
function AuthPanel({
  children,
  footerAction,
  footerActionText = 'Contact admin',
  footerText = 'Do not have an account?',
  subtitle,
  title,
}: AuthPanelProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#02040a] p-10 max-xl:p-8 max-lg:p-6 max-md:p-4 max-sm:p-3">
      <img
        src={loginBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />

      <section className="relative grid min-h-[800px] w-full max-w-[1180px] grid-cols-2 overflow-hidden rounded-[30px] border-[6px] border-white bg-transparent shadow-[0_34px_90px_rgba(0,0,0,0.38)] before:absolute before:inset-y-0 before:right-0 before:left-1/2 before:z-0 before:bg-white before:content-[''] max-xl:min-h-[720px] max-lg:min-h-[660px] max-md:min-h-0 max-md:grid-cols-1 max-md:rounded-[22px] max-md:border-4 max-md:before:hidden">
        <aside className="relative z-20 flex min-h-full flex-col justify-between overflow-hidden bg-transparent px-10 py-11 max-lg:px-8 max-lg:py-9 max-md:min-h-[340px] max-md:p-7 max-sm:min-h-[260px] max-sm:p-5">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-black/15 to-black/35" />
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_92%,rgba(0,0,0,0.32),transparent_42%)]" />

          <div className="relative z-10 flex items-center gap-3.5 text-[13px] font-bold tracking-[4px] text-white max-sm:text-[11px] max-sm:tracking-[3px]">
            <span>A WISE QUOTE</span>
            <i className="block h-px w-24 bg-white/70 max-sm:w-14" />
          </div>

          <div className="relative z-10 max-w-[410px]">
            <Title
              level={1}
              className="!m-0 !font-serif !text-[62px] !font-medium !leading-[0.96] !tracking-[0] !text-white max-lg:!text-[54px] max-md:!text-[44px] max-sm:!text-[36px]"
            >
              Get
              <br />
              Everything
              <br />
              You Want
            </Title>
          </div>
        </aside>

        <div className="relative z-10 grid min-h-full grid-rows-[104px_1fr_68px] justify-items-center rounded-r-[22px] bg-white px-[54px] max-lg:px-9 max-md:min-h-[540px] max-md:grid-rows-[72px_1fr_56px] max-md:rounded-b-[18px] max-md:rounded-tr-none max-md:px-[22px] max-md:py-[26px] max-sm:min-h-[520px] max-sm:px-4 max-sm:py-5">
          <div className="self-center inline-flex items-center gap-[9px] text-[15px] font-bold text-[#111111]">
            <span className="inline-block h-[18px] w-[18px] rounded-full bg-[image:radial-gradient(circle_at_50%_50%,transparent_34%,#111111_36%,#111111_44%,transparent_46%),repeating-conic-gradient(from_0deg,#111111_0deg_18deg,transparent_18deg_30deg)]" />
            <span>React Theme</span>
          </div>

          <div className="w-full max-w-[350px] self-center -translate-y-3.5 max-lg:max-w-[330px] max-md:max-w-[360px] max-md:translate-y-0">
            <div className="mb-[38px] text-center max-lg:mb-8 max-sm:mb-6">
              <Title
                level={2}
                className="!m-0 !mb-2.5 !font-serif !text-[42px] !font-medium !leading-[1.05] !tracking-[0] !text-[#050505] max-lg:!text-[38px] max-md:!text-[34px] max-sm:!text-[30px]"
              >
                {title}
              </Title>
              {subtitle && (
                <Paragraph className="!m-0 !text-xs !leading-normal !text-[#333333]">
                  {subtitle}
                </Paragraph>
              )}
            </div>

            {children}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 self-center text-center text-[11px] text-[#8b8b92] max-sm:text-[10px]">
            {footerText && (
              <Typography.Text className="!text-[11px] !text-[#8b8b92] max-sm:!text-[10px]">
                {footerText}
              </Typography.Text>
            )}
            {footerAction ? (
              <Typography.Link
                className="!text-[11px] !font-semibold !text-[#66666d] max-sm:!text-[10px]"
                onClick={footerAction}
              >
                {footerActionText}
              </Typography.Link>
            ) : (
              <Typography.Text
                strong
                className="!text-[11px] !text-[#66666d] max-sm:!text-[10px]"
              >
                {footerActionText}
              </Typography.Text>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthPanel
