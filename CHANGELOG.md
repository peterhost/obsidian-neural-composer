# Changelog

All notable changes to this branch (`entities-persons`) are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] - entities-persons

### Added

- **Person entity detection from frontmatter.** Notes can now declare a
  `people: [Name1, Name2]` (or `person: Name`) field in their YAML
  frontmatter to reinforce LightRAG's Person-entity extraction:
  - A normalized text hint (`People mentioned in this note: ...`) is always
    injected into the content sent to LightRAG at ingestion time, for `.md`
    files, to help the server's LLM-based extraction recall and name people
    consistently across notes.
  - A new setting, **"Create people from frontmatter"** (off by default,
    Settings → Graph & Vault), additionally calls LightRAG's
    `/graph/entity/exists` and `/graph/entity/create` REST endpoints after
    ingestion completes, guaranteeing each declared name exists as a
    `Person` entity in the graph even if the LLM extraction misses it.
    These calls fail silently (logged as warnings) if the connected
    LightRAG server doesn't support them, so older servers are unaffected.
  - New files: `src/utils/frontmatter.ts` (frontmatter parsing +
    hint-building) and `src/utils/frontmatter.test.ts`.
  - Touches: `src/core/rag/ragEngine.ts` (`ingestFile`, new
    `ensurePersonEntities`), `src/main.ts` (single-file and bulk-folder
    ingestion commands), `src/settings/schema/setting.types.ts`
    (`enableFrontmatterPeopleEntities`), `src/components/settings/sections/NeuralSection.tsx`
    (new toggle), `README.md` (Advanced Options table).

### Fixed

- Prettier formatting and an `obsidianmd/ui/sentence-case` lint violation
  introduced by the new settings UI copy above.
