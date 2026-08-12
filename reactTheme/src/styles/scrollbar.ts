/**
 * Thin, theme-aware scrollbar as Tailwind utilities (replaces the old
 * `.slim-scroll` custom CSS). Tailwind v4 ships no first-class scrollbar
 * utilities, so this uses arbitrary properties (`[scrollbar-width:thin]`) and
 * arbitrary `::-webkit-scrollbar` variants. Kept in one constant so the two
 * consumers can't drift.
 */
export const slimScroll =
  '[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.5)_transparent] ' +
  '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 ' +
  '[&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50 ' +
  '[&::-webkit-scrollbar-thumb:hover]:bg-slate-500/70 ' +
  'dark:[scrollbar-color:rgba(255,255,255,0.25)_transparent] ' +
  'dark:[&::-webkit-scrollbar-thumb]:bg-white/25 ' +
  'dark:[&::-webkit-scrollbar-thumb:hover]:bg-white/40'
