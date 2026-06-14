import type { ComponentType } from 'react'
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter'
import { memo } from 'react'
import SyntaxHighlighterBase from 'react-syntax-highlighter/dist/esm/prism-light'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'

import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'

// react-syntax-highlighter ESM dist paths lack type declarations for static members
// and language modules; cast to a typed interface that matches the actual runtime shape.
type SyntaxHighlighterWithRegister = ComponentType<SyntaxHighlighterProps> & {
  registerLanguage: (name: string, lang: unknown) => void
}
const SyntaxHighlighter = SyntaxHighlighterBase as unknown as SyntaxHighlighterWithRegister

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('yaml', yaml)

function SyntaxHighlighterWrapper({
  isDarkMode,
  language,
  hasFilename,
  wrapLines,
  children,
}: {
  isDarkMode: boolean
  language: string | undefined
  hasFilename: boolean
  wrapLines: boolean
  children: string
}) {
  return (
    <SyntaxHighlighter
      language={language}
      style={isDarkMode ? oneDark : oneLight}
      customStyle={{
        borderRadius: hasFilename
          ? '0 0 var(--radius-s) var(--radius-s)'
          : 'var(--radius-s)',
        margin: 0,
        padding: 'var(--size-4-2)',
        fontSize: 'var(--font-ui-small)',
        fontFamily:
          language === 'markdown' ? 'var(--font-interface)' : 'inherit',
      }}
      wrapLines={wrapLines}
      lineProps={
        wrapLines
          ? {
              style: { whiteSpace: 'pre-wrap' },
            }
          : undefined
      }
    >
      {children}
    </SyntaxHighlighter>
  )
}

export const MemoizedSyntaxHighlighterWrapper = memo(SyntaxHighlighterWrapper)
