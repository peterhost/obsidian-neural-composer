import { Check, CopyIcon, Eye, Loader2, Play } from 'lucide-react'
import { PropsWithChildren, useMemo, useState } from 'react'

import { useApp } from '../../contexts/app-context'
import { useDarkModeContext } from '../../contexts/dark-mode-context'
import { parseTagContents } from '../../utils/chat/parse-tag-content'
import { openMarkdownFile } from '../../utils/obsidian'

import MarkdownReferenceBlock from './MarkdownReferenceBlock'
import { ObsidianMarkdown } from './ObsidianMarkdown'
import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

/**
 * Renders markdown content that may contain nested <nrlcmp_block> reference
 * tags (e.g. when citations-on mode inserts inline block references).
 * Splits the string via parseTagContents so reference blocks are rendered
 * as MarkdownReferenceBlock rather than raw HTML text.
 */
function MarkdownPreviewRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => parseTagContents(content), [content])

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'string') {
          return <ObsidianMarkdown key={index} content={block.content} scale="sm" />
        }
        if (
          block.type === 'nrlcmp_block' &&
          block.filename &&
          block.startLine &&
          block.endLine
        ) {
          return (
            <MarkdownReferenceBlock
              key={index}
              filename={block.filename}
              startLine={block.startLine}
              endLine={block.endLine}
              language={block.language}
            />
          )
        }
        // nrlcmp_block without startLine/endLine inside a markdown block:
        // render as plain markdown (shouldn't normally happen)
        return block.content ? (
          <ObsidianMarkdown key={index} content={block.content} scale="sm" />
        ) : null
      })}
    </>
  )
}

export default function MarkdownCodeComponent({
  onApply,
  isApplying,
  language,
  filename,
  children,
}: PropsWithChildren<{
  onApply: (blockToApply: string) => void
  isApplying: boolean
  language?: string
  filename?: string
}>) {
  const app = useApp()
  const { isDarkMode } = useDarkModeContext()

  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [copied, setCopied] = useState(false)

  // Fix: Safe extraction of string content to avoid "[object Object]"
  // and satisfy the linter rule about default stringification.
  const codeContent = typeof children === 'string' ? children : ''

  const wrapLines = useMemo(() => {
    return !language || ['markdown'].includes(language)
  }, [language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleOpenFile = () => {
    if (filename) {
      openMarkdownFile(app, filename)
    }
  }

  return (
    <div className="nrlcmp-code-block">
      <div className="nrlcmp-code-block-header">
        {filename && (
          <div
            className="nrlcmp-code-block-header-filename"
            onClick={handleOpenFile}
          >
            {filename}
          </div>
        )}
        <div className="nrlcmp-code-block-header-button-container">
          <button
            className="clickable-icon nrlcmp-code-block-header-button"
            onClick={() => {
              setIsPreviewMode(!isPreviewMode)
            }}
          >
            <Eye size={12} />
            {/* Fix: Sentence case */}
            {isPreviewMode ? 'View raw text' : 'View formatted'}
          </button>
          <button
            className="clickable-icon nrlcmp-code-block-header-button"
            onClick={() => {
              // Fix: Handle floating promise
              void handleCopy()
            }}
          >
            {copied ? (
              <>
                <Check size={10} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={10} />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            className="clickable-icon nrlcmp-code-block-header-button"
            onClick={
              isApplying
                ? undefined
                : () => {
                    onApply(codeContent)
                  }
            }
            aria-disabled={isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="spinner" size={14} />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Play size={10} />
                <span>Apply</span>
              </>
            )}
          </button>
        </div>
      </div>
      {isPreviewMode ? (
        <div className="nrlcmp-code-block-obsidian-markdown">
          {language === 'markdown' ? (
            <MarkdownPreviewRenderer content={codeContent} />
          ) : (
            <ObsidianMarkdown content={codeContent} scale="sm" />
          )}
        </div>
      ) : (
        <MemoizedSyntaxHighlighterWrapper
          isDarkMode={isDarkMode}
          language={language}
          hasFilename={!!filename}
          wrapLines={wrapLines}
        >
          {codeContent}
        </MemoizedSyntaxHighlighterWrapper>
      )}
    </div>
  )
}
