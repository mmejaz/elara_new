/**
 * A subtle animated wave, self-contained: the flow is an SVG SMIL
 * `<animateTransform>`, so it needs no keyframes / custom CSS. Two identical
 * wave halves are drawn across a 2880-wide group inside a 1440 viewBox, then the
 * group translates left by exactly one 1440 pattern — because the halves match,
 * the loop is seamless.
 *
 * Drop it into any `position: relative` container as a decorative background:
 *   <div className="relative overflow-hidden">
 *     <WaveAccent color={primaryColor} />
 *     <div className="relative z-10">…content…</div>
 *   </div>
 */
interface WaveLayer {
  color: string
  opacity: number
  duration: number
}

function Wave({ color, opacity, duration }: WaveLayer) {
  const period = 'c90,-18 270,18 360,0'
  const d = `M0,55 ${Array(8).fill(period).join(' ')} V100 H0 Z`

  return (
    <path d={d} fill={color} fillOpacity={opacity}>
      <animateTransform
        attributeName="transform"
        type="translate"
        from="0 0"
        to="-1440 0"
        dur={`${duration}s`}
        repeatCount="indefinite"
      />
    </path>
  )
}

interface WaveAccentProps {
  /** Wave color (kept subtle via low fill-opacity). Defaults to a soft teal. */
  color?: string
  /** Extra classes for the absolutely-positioned SVG (height, opacity, etc.). */
  className?: string
}

function WaveAccent({ color = '#14b8a6', className = 'h-12' }: WaveAccentProps) {
  return (
    <svg
      className={`pointer-events-none absolute inset-x-0 bottom-0 w-full ${className}`}
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <Wave color={color} opacity={0.08} duration={14} />
      <Wave color={color} opacity={0.14} duration={9} />
    </svg>
  )
}

export default WaveAccent
