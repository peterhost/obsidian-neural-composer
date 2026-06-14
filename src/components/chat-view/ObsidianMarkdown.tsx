import { App, Keymap, MarkdownRenderer } from 'obsidian'
import { memo, useCallback, useEffect, useRef } from 'react'

import { useApp } from '../../contexts/app-context'
import { useChatView } from '../../contexts/chat-view-context'

type ObsidianMarkdownProps = {
  content: string
  scale?: 'xs' | 'sm' | 'base'
}

/**
 * Normalize LaTeX delimiters emitted by LLMs to the Obsidian/MathJax format.
 * LLMs commonly output \(...\) and \[...\]; Obsidian only renders $...$ and $$...$$
 * Content inside fenced code blocks and inline code spans is left untouched.
 */
function normalizeLatexDelimiters(content: string): string {
  const codeBlocks: string[] = []
  const withPlaceholders = content.replace(
    /```[\s\S]*?```|`[^`\n]*`/g,
    (match) => {
      codeBlocks.push(match)
      return `\x00CODE${codeBlocks.length - 1}\x00`
    },
  )
  const normalized = withPlaceholders
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) => `$${inner}$`)
  return normalized.replace(
    /\x00CODE(\d+)\x00/g,
    (_m, idx: string) => codeBlocks[parseInt(idx)],
  )
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
        normalizeLatexDelimiters(content),
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

export { ObsidianCodeBlock, ObsidianMarkdown }
