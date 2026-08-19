import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { Modal, Button } from 'antd'
import {
  ExpandOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useAppSelector } from '../../../store/hooks'

interface Props {
  /** Raw markdown of the current document. */
  content: string
  /** Key of the current document, used to resolve relative links. */
  docKey: string
  /** Called when an in-guide markdown link is clicked. */
  onNavigate: (key: string) => void
  /** Resolve a relative link to an in-guide doc key (guide-specific), or null. */
  resolveLink: (fromKey: string, href: string) => string | null
}

let mermaidSeq = 0

const SCALE_MIN = 0.5
const SCALE_MAX = 4
const clampScale = (s: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, +s.toFixed(2)))

/**
 * Full-screen viewer for a rendered diagram. Reuses the already-rendered SVG
 * string; supports zoom (buttons + ctrl/⌘-wheel), reset, and drag-to-pan.
 */
function DiagramModal({
  svg,
  open,
  onClose,
}: {
  svg: string
  open: boolean
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; l: number; t: number } | null>(null)
  const [scale, setScale] = useState(1)

  // Inject the SVG the moment the holder node attaches. A callback ref (rather
  // than an effect) is used because AntD's Modal mounts its body asynchronously,
  // so an effect can run before the holder exists.
  const setHolder = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      node.innerHTML = svg
      const el = node.querySelector('svg')
      if (el) {
        // Give the SVG an explicit natural size from its viewBox so it doesn't
        // collapse in the shrink-to-fit holder; the wrapper's transform zooms it.
        const vb = el.viewBox?.baseVal
        el.style.maxWidth = 'none'
        if (vb && vb.width) {
          el.style.width = `${vb.width}px`
          el.style.height = `${vb.height}px`
        }
      }
    },
    [svg],
  )

  // Reset zoom each time the viewer opens.
  useEffect(() => {
    if (open) setScale(1)
  }, [open])

  const zoom = (delta: number) => setScale((s) => clampScale(s + delta))

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="92vw"
      centered
      title="Diagram"
      styles={{ body: { padding: 0 } }}
    >
      <div className="ug-diagram-toolbar">
        <Button size="small" icon={<ZoomOutOutlined />} onClick={() => zoom(-0.25)} />
        <span className="ug-zoom-level">{Math.round(scale * 100)}%</span>
        <Button size="small" icon={<ZoomInOutlined />} onClick={() => zoom(0.25)} />
        <Button size="small" icon={<ReloadOutlined />} onClick={() => setScale(1)}>
          Reset
        </Button>
        <span className="ug-zoom-hint">Drag to pan · Ctrl/⌘ + scroll to zoom</span>
      </div>
      <div
        ref={scrollRef}
        className="ug-diagram-stage"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoom(e.deltaY < 0 ? 0.15 : -0.15)
          }
        }}
        onPointerDown={(e) => {
          const c = scrollRef.current
          if (!c) return
          drag.current = { x: e.clientX, y: e.clientY, l: c.scrollLeft, t: c.scrollTop }
          c.setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          const c = scrollRef.current
          if (!c || !drag.current) return
          c.scrollLeft = drag.current.l - (e.clientX - drag.current.x)
          c.scrollTop = drag.current.t - (e.clientY - drag.current.y)
        }}
        onPointerUp={() => {
          drag.current = null
        }}
      >
        <div
          ref={setHolder}
          className="ug-diagram-holder"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </Modal>
  )
}

/**
 * Renders one ```mermaid block into an SVG diagram. Validates with `parse`
 * first and suppresses Mermaid's built-in error graphic, so an invalid diagram
 * degrades to its readable source instead of a "Syntax error" bomb. When it
 * renders, a "Zoom" affordance opens the diagram in a pan/zoom modal.
 */
function Mermaid({ chart, dark }: { chart: string; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      theme: dark ? 'dark' : 'default',
    })

    const showSource = () => {
      if (cancelled || !ref.current) return
      setSvg(null)
      ref.current.replaceChildren()
      const pre = document.createElement('pre')
      pre.className = 'ug-code'
      pre.textContent = chart // textContent → safe, no HTML injection
      ref.current.appendChild(pre)
    }

    const render = async () => {
      const id = 'mmd-' + (mermaidSeq += 1)
      try {
        await mermaid.parse(chart) // throws on invalid syntax
        const { svg: out } = await mermaid.render(id, chart)
        if (!cancelled && ref.current) {
          ref.current.innerHTML = out
          setSvg(out)
        }
      } catch {
        showSource()
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [chart, dark])

  return (
    <div className="ug-diagram">
      <div
        ref={ref}
        className={`my-4 flex justify-center overflow-x-auto${svg ? ' ug-diagram-zoomable' : ''}`}
        onClick={() => svg && setOpen(true)}
        title={svg ? 'Click to zoom' : undefined}
      />
      {svg && (
        <button
          type="button"
          className="ug-zoom-btn"
          onClick={() => setOpen(true)}
          aria-label="Zoom diagram"
        >
          <ExpandOutlined /> Zoom
        </button>
      )}
      {svg && <DiagramModal svg={svg} open={open} onClose={() => setOpen(false)} />}
    </div>
  )
}

function MarkdownView({ content, docKey, onNavigate, resolveLink }: Props) {
  const isDark = useAppSelector((s) => s.ui.themeMode === 'dark')

  return (
    <div className="ug-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render fenced ```mermaid as a diagram; everything else as normal code.
          pre({ children }) {
            const child = Array.isArray(children) ? children[0] : children
            const cls = (child as { props?: { className?: string } })?.props?.className ?? ''
            if (/language-mermaid/.test(cls)) {
              const code = String((child as { props?: { children?: unknown } })?.props?.children ?? '')
              return <Mermaid chart={code.trim()} dark={isDark} />
            }
            return <pre className="ug-code">{children}</pre>
          },
          // Intercept links between docs so they open in the reader.
          a({ href, children }) {
            const target = href ? resolveLink(docKey, href) : null
            if (target) {
              return (
                <a
                  href={`#${target}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate(target)
                  }}
                >
                  {children}
                </a>
              )
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}

export default MarkdownView
