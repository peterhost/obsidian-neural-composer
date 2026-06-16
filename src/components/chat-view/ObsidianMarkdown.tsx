import { App, Keymap, MarkdownRenderer } from 'obsidian'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import { useApp } from '../../contexts/app-context'
import { useChatView } from '../../contexts/chat-view-context'
import { splitSvgBlocks } from '../../utils/chat/split-svg-blocks'

type ObsidianMarkdownProps = {
  content: string
  scale?: 'xs' | 'sm' | 'base'
}

/**
 * Renders Obsidian Markdown content using the Obsidian MarkdownRenderer.
 *
 * @param content - The Obsidian Markdown content to render.
 * @param scale - The scale of the markdown content.
 * @returns A React component that renders the Obsidian Markdown content.
 */
const ObsidianMarkdown = memo(function ObsidianMarkdown({
  content,
  scale = 'base',
}: ObsidianMarkdownProps) {
  const app = useApp()
  const chatView = useChatView()
  const containerRef = useRef<HTMLDivElement>(null)

  const renderMarkdown = useCallback(async () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      await MarkdownRenderer.render(
        app,
        content,
        containerRef.current,
        app.workspace.getActiveFile()?.path ?? '',
        chatView,
      )

      setupMarkdownLinks(
        app,
        containerRef.current,
        app.workspace.getActiveFile()?.path ?? '',
      )
    }
  }, [app, content, chatView])

  useEffect(() => {
    // FIX: Use void operator to explicitly ignore the returned promise
    void renderMarkdown()
  }, [renderMarkdown])

  return (
    <div
      ref={containerRef}
      className={`markdown-rendered nrlcmp-markdown-rendered nrlcmp-scale-${scale}`}
    />
  )
})

/**
 * Adds click and hover handlers to internal links rendered by MarkdownRenderer.render().
 * Required because rendered links are not interactive by default.
 *
 * @see https://forum.obsidian.md/t/internal-links-dont-work-in-custom-view/90169/3
 */
function setupMarkdownLinks(
  app: App,
  containerEl: HTMLElement,
  sourcePath: string,
  showLinkHover?: boolean,
) {
  containerEl.querySelectorAll('a.internal-link').forEach((el) => {
    el.addEventListener('click', (evt: MouseEvent) => {
      evt.preventDefault()
      const linktext = el.getAttribute('href')
      if (linktext) {
        // FIX: Wrap async call in a void IIFE to prevent floating promise in event listener
        void (async () => {
          await app.workspace.openLinkText(
            linktext,
            sourcePath,
            Keymap.isModEvent(evt),
          )
        })()
      }
    })

    if (showLinkHover) {
      el.addEventListener('mouseover', (event: MouseEvent) => {
        event.preventDefault()
        const linktext = el.getAttribute('href')
        if (linktext) {
          app.workspace.trigger('hover-link', {
            event,
            source: 'preview',
            hoverParent: { hoverPopover: null },
            targetEl: event.currentTarget,
            linktext: linktext,
            sourcePath: sourcePath,
          })
        }
      })
    }
  })
}

function sanitizeSvg(svg: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  doc.querySelectorAll('script').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes)
      .filter((attr) => attr.name.startsWith('on'))
      .forEach((attr) => el.removeAttribute(attr.name))
  })
  return doc.documentElement.outerHTML
}

// Renders markdown that may contain inline <svg>...</svg> elements.
// MarkdownRenderer.render() strips raw HTML when called from a plugin context,
// so SVG blocks are extracted and injected directly; text parts go through
// ObsidianMarkdown as usual.
function SvgAwareMarkdown({
  content,
  scale,
}: {
  content: string
  scale?: 'xs' | 'sm' | 'base'
}) {
  const parts = useMemo(() => splitSvgBlocks(content), [content])

  if (parts.length === 1 && parts[0].type === 'text') {
    return <ObsidianMarkdown content={parts[0].content} scale={scale} />
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'svg' ? (
          <div
            key={i}
            className="nrlcmp-svg-preview"
            dangerouslySetInnerHTML={{ __html: sanitizeSvg(part.content) }}
          />
        ) : (
          <ObsidianMarkdown key={i} content={part.content} scale={scale} />
        ),
      )}
    </>
  )
}

function ObsidianCodeBlock({
  content,
  language,
  scale = 'sm',
}: {
  content: string
  language?: string
  scale?: 'xs' | 'sm' | 'base'
}) {
  return (
    <div className="nrlcmp-obsidian-code-block">
      <ObsidianMarkdown
        content={`\`\`\`${language ?? ''}\n${content}\n\`\`\``}
        scale={scale}
      />
    </div>
  )
}

export { ObsidianCodeBlock, ObsidianMarkdown, SvgAwareMarkdown }
