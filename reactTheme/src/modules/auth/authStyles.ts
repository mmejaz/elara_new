/**
 * Shared Tailwind class strings for the auth screens.
 *
 * Login and Forgot Password render identical fields, buttons and labels; these
 * constants are the single source of truth so the two pages can't drift. All
 * styling is Tailwind (arbitrary values + `dark:` variants) — no custom CSS.
 */

// AntD Form.Item wrapper: label sizing/contrast, tighter mobile spacing.
export const authFormItem =
  '!mb-5 max-sm:!mb-4 ' +
  '[&_.ant-form-item-label>label]:!h-auto ' +
  '[&_.ant-form-item-label>label]:!text-[13px] ' +
  '[&_.ant-form-item-label>label]:!font-medium ' +
  '[&_.ant-form-item-label>label]:!text-[#080808] ' +
  'dark:[&_.ant-form-item-label>label]:!text-slate-200'

// AntD Input / Input.Password: soft filled field, borderless, theme-aware.
export const authInput =
  '!min-h-[38px] !rounded-lg !border-0 !text-[13px] !shadow-none ' +
  '!bg-[#f4f4f6] hover:!bg-[#f1f1f4] focus:!bg-[#f1f1f4] focus-within:!bg-[#f1f1f4] !text-[#111111] ' +
  'dark:!bg-slate-800 dark:hover:!bg-slate-700 dark:focus:!bg-slate-700 dark:focus-within:!bg-slate-700 dark:!text-slate-100 ' +
  '[&_.ant-input-prefix]:!mr-2.5 [&_.ant-input-prefix]:!text-[#8b8b92] ' +
  '[&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[13px] ' +
  'dark:[&_.ant-input]:!text-slate-100 dark:[&_input::placeholder]:!text-slate-500'

// Reveal-password eye toggle: enlarged + higher contrast than AntD's default.
export const authPasswordIcon =
  '[&_.ant-input-password-icon]:!ml-1 [&_.ant-input-password-icon]:!p-1 ' +
  '[&_.ant-input-password-icon]:!text-[17px] [&_.ant-input-password-icon]:!text-[#6b6b72] ' +
  '[&_.ant-input-password-icon:hover]:!text-[#1677ff] ' +
  'dark:[&_.ant-input-password-icon]:!text-slate-400'

// Primary submit button: solid near-black pill, theme-aware.
export const authSubmitButton =
  '!mt-0 !h-[38px] !rounded-lg !text-[13px] !font-semibold !shadow-none ' +
  '!bg-[#050505] hover:!bg-[#202020] ' +
  'dark:!bg-white dark:!text-slate-900 dark:hover:!bg-slate-200'
