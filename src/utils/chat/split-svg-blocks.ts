type TextPart = { type: 'text'; content: string }
type SvgPart = { type: 'svg'; content: string }
export type SvgContentPart = TextPart | SvgPart

// Splits a markdown string into alternating text and <svg>...</svg> parts.
// Used to work around MarkdownRenderer.render() stripping raw HTML (including SVG)
// when called from a plugin context — SVG parts are injected directly into the DOM
// via dangerouslySetInnerHTML; text parts go through ObsidianMarkdown as usual.
export function splitSvgBlocks(content: string): SvgContentPart[] {
  const parts: SvgContentPart[] = []
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = svgRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) parts.push({ type: 'text', content: text })
    }
    parts.push({ type: 'svg', content: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) parts.push({ type: 'text', content: text })
  }

  return parts
}
