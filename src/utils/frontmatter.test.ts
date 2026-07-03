import { buildPeopleHint, extractPeopleFromFrontmatter } from './frontmatter'

describe('extractPeopleFromFrontmatter', () => {
  it('returns an empty list when frontmatter is undefined', () => {
    expect(extractPeopleFromFrontmatter(undefined)).toEqual([])
  })

  it('returns an empty list when neither people nor person is set', () => {
    expect(extractPeopleFromFrontmatter({ tags: ['a'] })).toEqual([])
  })

  it('normalizes a single string person field into a list', () => {
    expect(extractPeopleFromFrontmatter({ person: 'Alice Dupont' })).toEqual([
      'Alice Dupont',
    ])
  })

  it('reads a list of names from the people field', () => {
    expect(
      extractPeopleFromFrontmatter({ people: ['Alice Dupont', 'Bob Martin'] }),
    ).toEqual(['Alice Dupont', 'Bob Martin'])
  })

  it('trims whitespace and drops empty entries', () => {
    expect(
      extractPeopleFromFrontmatter({ people: ['  Alice Dupont  ', '', '   '] }),
    ).toEqual(['Alice Dupont'])
  })

  it('deduplicates repeated names', () => {
    expect(
      extractPeopleFromFrontmatter({
        people: ['Alice Dupont', 'Alice Dupont'],
      }),
    ).toEqual(['Alice Dupont'])
  })

  it('ignores non-string entries', () => {
    expect(
      extractPeopleFromFrontmatter({ people: ['Alice Dupont', 42, null] }),
    ).toEqual(['Alice Dupont'])
  })

  it('prefers people over person when both are set', () => {
    expect(
      extractPeopleFromFrontmatter({
        people: ['Alice Dupont'],
        person: 'Bob Martin',
      }),
    ).toEqual(['Alice Dupont'])
  })
})

describe('buildPeopleHint', () => {
  it('returns an empty string for an empty list', () => {
    expect(buildPeopleHint([])).toBe('')
  })

  it('builds a normalized hint line for one person', () => {
    expect(buildPeopleHint(['Alice Dupont'])).toBe(
      'People mentioned in this note: Alice Dupont.\n',
    )
  })

  it('builds a normalized hint line for multiple people', () => {
    expect(buildPeopleHint(['Alice Dupont', 'Bob Martin'])).toBe(
      'People mentioned in this note: Alice Dupont, Bob Martin.\n',
    )
  })
})
