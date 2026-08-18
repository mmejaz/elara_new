import { useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { useAppSelector } from '../../../store/hooks'
import { resolveDocLink } from '../docs'

interface Props {
  /** Raw markdown of the current document. */
  content: string
  /** Key of the current document, used to resolve relative links. */
  docKey: string
  /** Called when an in-guide markdown link is clicked. */
  onNavigate: (key: string) => void
}

let mermaidSeq = 0

/**
 * Renders one ```mermaid block into an SVG diagram. Validates with `parse`
 * first and suppresses Mermaid's built-in error graphic, so an invalid diagram
 * degrades to its readable source instead of a "Syntax error" bomb.
 */
function Mermaid({ chart, dark }: { chart: string; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

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
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch {
        showSource()
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [chart, dark])

  return <div ref={ref} className="my-4 flex justify-center overflow-x-auto" />
}

function MarkdownView({ content, docKey, onNavigate }: Props) {
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
            const target = href ? resolveDocLink(docKey, href) : null
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
