# People entities from frontmatter

This document describes a feature added on the `entities-persons` branch:
using a note's YAML frontmatter to improve detection of `Person` entities
in the LightRAG knowledge graph. It has two parts: **Part 1** is for
end users of the plugin, **Part 2** is for developers who need to
understand or extend the implementation.

---

## Part 1 — User guide

### Why this exists

Neural Composer sends each note's raw text to a LightRAG server, which
extracts entities (people, places, concepts, etc.) using an LLM. That
extraction can:

- **miss** people who are mentioned briefly or indirectly in a note, and
- **split** the same person into multiple graph nodes when they're
  referred to differently across notes (e.g. "Peter" in one note, "Peter
  Host" in another).

If you already know who a note is about, you can tell the plugin
directly via frontmatter instead of relying entirely on LLM extraction.

### How to declare people in a note

Add a `people` field to a note's frontmatter, listing the canonical names
you want recognized:

```yaml
---
people: [Alice Dupont, Bob Martin]
---

# Project kickoff

Meeting notes from the kickoff. Alice will lead design, Bob handles infra.
```

A single name also works, using the singular key:

```yaml
---
person: Alice Dupont
---

# 1:1 with Alice

Discussed her roadmap for Q3.
```

Names are trimmed and de-duplicated automatically. This only applies to
`.md` notes — frontmatter on other file types (`.txt`, `.pdf`, etc.) is
ignored, since only Obsidian notes have YAML frontmatter.

### What happens when you ingest a note

There are two independent levels of behavior.

**1. Text hint — always on, nothing to configure.**
Whenever a `.md` file with declared people is ingested (via "Ingest
current file into knowledge graph", bulk folder ingestion, or incremental
vault sync), the plugin inserts a normalized sentence right after the
note's title, before sending the content to LightRAG:

```
Title: Project kickoff

People mentioned in this note: Alice Dupont, Bob Martin.

# Project kickoff
Meeting notes from the kickoff. Alice will lead design, Bob handles infra.
```

This costs nothing extra and works whether your LightRAG server is local
or remote — it just gives the LLM-based extraction a clearer, consistently
worded signal.

**2. Direct entity creation — opt-in setting.**
Go to **Settings → Neural Composer → Graph & Vault → "Create people from
frontmatter"** and enable the toggle for a stronger guarantee: once
LightRAG finishes processing an ingested note, the plugin checks each
declared name against the graph and, if missing, creates it directly as a
`person` entity — independent of whether the LLM extraction found it in
the text.

This is off by default because it adds extra requests per ingested file,
and because not every LightRAG server version supports the endpoints it
relies on. If yours doesn't, the calls fail silently (a warning goes to
the developer console) and ingestion itself is unaffected — you simply
keep only the level-1 text hint.

### Example walkthrough

1. Create a note `People/Alice Dupont.md`:
   ```yaml
   ---
   people: [Alice Dupont]
   ---
   Alice Dupont is the lead designer on the Neural Composer project.
   ```
2. Enable "Create people from frontmatter" in settings (optional, for the
   stronger guarantee).
3. Run "Ingest current file into knowledge graph" from the command
   palette.
4. Open the Graph view (2D or 3D) once processing finishes — you should
   find an "Alice Dupont" node typed as `Person`, even if the note body
   alone might not have been enough for the LLM extraction to pick her up
   confidently.

### How this relates to "Custom Ontology"

This feature is independent of, but complementary to, the existing
**Custom Ontology** setting (Settings → Graph & Vault → Ontology section).
That setting controls which entity *types* LightRAG recognizes at all
(`Person, Creature, Organization, ...` by default) via a server-side
`.env` variable, and requires a full re-ingestion of your vault to take
effect. This feature assumes `Person` is already one of your configured
entity types (it is, by default) and works at the level of individual
notes, without touching your ontology or restarting the server. Unlike
the Ontology section, it also isn't limited to desktop or local servers.

### Limitations

- Declaring a person in frontmatter doesn't create relationships between
  that person and other entities automatically — only the entity itself
  is guaranteed to exist. Relationships still come from LightRAG's own
  extraction of the note body.
- If a declared name doesn't exactly match how extraction names the same
  person elsewhere, you may end up with two separate nodes. Use LightRAG's
  merge tooling (graph view → right-click → merge) to consolidate them.
- The direct-creation endpoints are recent additions to LightRAG's API and
  may not exist on older self-hosted servers (see level 2 above).

---

## Part 2 — Developer guide

### Design summary

Two independent mechanisms, both gated on `.md` files only:

| Level | Trigger | Mechanism | Failure mode |
|---|---|---|---|
| 1. Text hint | Always, when frontmatter has `people`/`person` | Prepend a sentence to the text sent to `POST /documents/texts` | N/A (pure string manipulation, no network call) |
| 2. Entity creation | Only when `settings.enableFrontmatterPeopleEntities` is `true` | `GET /graph/entity/exists` then `POST /graph/entity/create` per declared name, after ingestion's pipeline finishes | Caught per-name, logged via `console.warn`, never thrown — ingestion success is not affected |

### New file: `src/utils/frontmatter.ts`

- `extractPeopleFromFrontmatter(frontmatter: Record<string, unknown> | undefined): string[]`
  — pure function, no Obsidian API dependency. Reads `frontmatter.people`
  (falls back to `frontmatter.person`), accepts either a string or an
  array, trims, drops empties, and de-duplicates via a `Set`. Kept pure so
  it doesn't need an `App`/`TFile` mock in tests.
- `getDeclaredPeople(app: App, file: TFile): string[]` — thin wrapper that
  reads `app.metadataCache.getFileCache(file)?.frontmatter` (Obsidian's
  own frontmatter cache — no new YAML dependency added) and delegates to
  `extractPeopleFromFrontmatter`.
- `buildPeopleHint(people: string[]): string` — returns `''` for an empty
  list, otherwise `"People mentioned in this note: A, B.\n"`.

Covered by `src/utils/frontmatter.test.ts` (8 cases: undefined frontmatter,
missing field, singular `person`, list `people`, whitespace trimming,
dedup, non-string entries ignored, `people` taking precedence over
`person`, plus 3 cases for `buildPeopleHint`).

### `src/core/rag/ragEngine.ts`

- `ingestFile()` (~line 358-370): for `.md` files, computes
  `buildPeopleHint(getDeclaredPeople(this.app, file))` and splices it
  between the existing `Title: {basename}` line and the note body, before
  calling `insertDocument()`. Non-`.md` text extensions and binary uploads
  are untouched.
- New method `ensurePersonEntities(people: string[], sourcePath: string): Promise<void>`
  (~line 381+): for each name, issues
  `GET {lightRagServerUrl}/graph/entity/exists?name=<encoded>` using the
  existing `getLightRagHeaders()` helper (adds `X-API-Key` when
  configured). If the response is an error or `{ exists: true }`, it skips
  to the next name. Otherwise it issues
  `POST {lightRagServerUrl}/graph/entity/create` with body
  `{ entity_name, entity_data: { entity_type: 'Person', description, source_id } }`.
  Every step is wrapped in `try/catch`; failures are `console.warn`-logged
  and looping continues — this method must never reject or throw, since
  it runs after ingestion has already succeeded.
  - These two endpoints (confirmed against `lightrag/api/routers/graph_routes.py`
    on the `HKUDS/LightRAG` `main` branch) were **not** already used
    anywhere in this codebase. `src/views/NativeGraphView.ts` already used
    sibling endpoints (`/graph/entity/edit`, `/graph/relation/create`,
    `/graph/entities/merge`) interactively from the graph view — those
    were the reference for header/body conventions, but this is the first
    use of `/graph/entity/exists` and `/graph/entity/create` in the repo,
    and the first time any graph-mutation call happens from the
    *ingestion* pipeline rather than user-driven graph-view actions.

### `src/main.ts`

The content-building logic in `RAGEngine.ingestFile()` is duplicated at
two call sites in `main.ts` (pre-existing duplication, not introduced by
this change — they use a different, broader extension list,
`TEXT_BASED_EXTENSIONS`, than `ingestFile`'s internal list, so they were
**not** unified into a single call to avoid changing which extensions
route to `insertDocument` vs `uploadDocument`):

- **Single-file ingest command** (~line 407-443): computes `people` once,
  injects the hint into `finalContent` for `.md`, and — after
  `monitorPipeline()` confirms processing — calls
  `ragEngine.ensurePersonEntities(people, file.path)` if the setting is on
  and `people` is non-empty.
- **Bulk folder ingest** (~line 905-965): same per-file hint injection
  inside the loop; since `monitorPipeline()` here runs once after *all*
  files are sent (not per file), declared people are accumulated into
  `declaredPeopleByPath: { path: string; people: string[] }[]` during the
  loop and processed in a second pass after the single `monitorPipeline()`
  call.

### Settings

- `src/settings/schema/setting.types.ts`: added
  `enableFrontmatterPeopleEntities: z.boolean().catch(false)` to the zod
  schema (line ~113) and `false` to `DEFAULT_SETTINGS` (line ~203). No
  `SETTINGS_SCHEMA_VERSION` bump was needed — a new optional field with
  `.catch()` doesn't require a migration entry, unlike a structural change
  to existing fields.
- `src/settings/schema/settings.test.ts`: the exact `toEqual(...)`
  snapshot of `parseNeuralComposerSettings({})`'s output had to be updated
  to include `enableFrontmatterPeopleEntities: false` — this test
  enumerates every settings key, so any new field breaks it until added
  here.

### Settings UI

- `src/components/settings/sections/NeuralSection.tsx` (~line 654-670):
  new `Setting` block, "Create people from frontmatter", placed
  **outside** the `if (!useRemote && Platform.isDesktop)` block that wraps
  the Ontology/Reranking sections. Those are gated to desktop-only local
  servers because they write to a local `.env` file; this feature is
  plain HTTP to `lightRagServerUrl`, so it's shown unconditionally
  (works with remote servers too).

### Docs

- `README.md`: one row added to the "Advanced Options" table.
- `CHANGELOG.md` (this branch): tracks the commits above.
- This file (`README2.md`).

### Known constraints for future work

- No retry/backoff on the `ensurePersonEntities` HTTP calls — a transient
  network blip just skips that name silently. Acceptable for a
  best-effort enhancement, but worth revisiting if this graduates to a
  more central feature.
- No UI feedback (e.g. a Notice) when entity creation succeeds, fails, or
  is skipped due to unsupported endpoints — currently only visible via the
  developer console (`console.warn`).
- The three ingestion call sites (`ragEngine.ingestFile`, and the two in
  `main.ts`) still duplicate the "build text to send" logic; this change
  added the same two-line hint computation to all three rather than
  refactoring them into one shared function, to keep the diff scoped to
  the frontmatter feature.
