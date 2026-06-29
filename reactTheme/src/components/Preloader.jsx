import { useSelector } from 'react-redux'

// Centered spinner used as the Suspense fallback for lazy routes.
function Preloader({ fullscreen = false, tip = 'Loading' }) {
  const primaryColor = useSelector((state) => state.ui.primaryColor)

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 ${
        fullscreen ? 'min-h-screen bg-white dark:bg-[#0a0a0a]' : 'min-h-[60vh]'
      }`}
    >
      <span className="app-spinner" style={{ borderTopColor: primaryColor }} />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {tip}…
      </span>
    </div>
  )
}

export default Preloader
