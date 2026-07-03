import { App, TFile } from 'obsidian'

/**
 * Normalizes the `people`/`person` frontmatter field into a deduped,
 * trimmed list of names. Accepts either a single string or a list, since
 * users may write `person: Alice` or `people: [Alice, Bob]`.
 */
export function extractPeopleFromFrontmatter(
  frontmatter: Record<string, unknown> | undefined,
): string[] {
  const raw = frontmatter?.people ?? frontmatter?.person
  if (raw === undefined || raw === null) return []
  const list = Array.isArray(raw) ? raw : [raw]
  const seen = new Set<string>()
  for (const value of list) {
    if (typeof value !== 'string') continue
    const name = value.trim()
    if (name.length > 0) seen.add(name)
  }
  return Array.from(seen)
}

export function getDeclaredPeople(app: App, file: TFile): string[] {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
    | Record<string, unknown>
    | undefined
  return extractPeopleFromFrontmatter(frontmatter)
}

export function buildPeopleHint(people: string[]): string {
  if (people.length === 0) return ''
  return `People mentioned in this note: ${people.join(', ')}.\n`
}
