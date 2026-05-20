import { ChevronDown, ChevronRight } from 'lucide-react'
import path from 'path-browserify'
import { useState } from 'react'

import { useApp } from '../../contexts/app-context'
import { SelectEmbedding } from '../../database/schema'
import { openMarkdownFile } from '../../utils/obsidian'

const SNIPPET_LENGTH = 150

function SimiliartySearchItem({
  chunk,
}: {
  chunk: Omit<SelectEmbedding, 'embedding'> & {
    similarity: number
  }
}) {
  const app = useApp()
  const [snippetOpen, setSnippetOpen] = useState(false)

  const isMarkdown = chunk.path.endsWith('.md')
  const hasLines =
    chunk.metadata.startLine !== 0 || chunk.metadata.endLine !== 0

  const handleRowClick = () => {
    if (isMarkdown) {
      openMarkdownFile(app, chunk.path, chunk.metadata.startLine)
    }
  }

  const handleSnippetToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSnippetOpen((v) => !v)
  }

  const snippet =
    chunk.content && chunk.content.trim().length > 0
      ? chunk.content.trim().slice(0, SNIPPET_LENGTH) +
        (chunk.content.trim().length > SNIPPET_LENGTH ? '…' : '')
      : null

  return (
    <div className="nrlcmp-similarity-search-item">
      {/* Main row */}
      <div
        className={`nrlcmp-similarity-search-item__row${isMarkdown ? ' nrlcmp-similarity-search-item__row--clickable' : ''}`}
        onClick={handleRowClick}
      >
        <span
          className="nrlcmp-similarity-search-item__similarity"
          style={{
            color:
              chunk.similarity >= 0.8
                ? 'var(--color-green)'
                : chunk.similarity >= 0.4
                  ? 'var(--color-yellow)'
                  : 'var(--text-muted)',
          }}
        >
          {Math.round(chunk.similarity * 100)}%
        </span>

        <span className="nrlcmp-similarity-search-item__path">
          {path.basename(chunk.path).replace(/^\[\d+\]\s*/, '')}
        </span>

        <span className="nrlcmp-similarity-search-item__line-numbers">
          {hasLines
            ? `lines ${chunk.metadata.startLine}–${chunk.metadata.endLine}`
            : null}
        </span>

        {snippet && (
          <button
            className="nrlcmp-similarity-search-item__snippet-toggle"
            onClick={handleSnippetToggle}
            aria-label={snippetOpen ? 'Hide snippet' : 'Show snippet'}
          >
            {snippetOpen ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        )}
      </div>

      {/* Expandable snippet */}
      {snippetOpen && snippet && (
        <div className="nrlcmp-similarity-search-item__snippet">{snippet}</div>
      )}
    </div>
  )
}

export default function SimilaritySearchResults({
  similaritySearchResults,
}: {
  similaritySearchResults: (Omit<SelectEmbedding, 'embedding'> & {
    similarity: number
  })[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  // Exclude the master "Graph's memory" entry — it's always 100% and redundant
  const displayedResults = similaritySearchResults.filter(
    (c) => c.path !== "Graph's memory",
  )

  return (
    <div className="nrlcmp-similarity-search-results">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="nrlcmp-similarity-search-results__trigger"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <div>Context used ({displayedResults.length})</div>
      </div>

      {isOpen && (
        <div className="nrlcmp-similarity-search-results__list">
          {displayedResults.map((chunk) => (
            <SimiliartySearchItem key={chunk.id} chunk={chunk} />
          ))}
        </div>
      )}
    </div>
  )
}
