# People entities from frontmatter

This document describes a feature added on the `entities-persons` branch:
using a note's YAML frontmatter to improve detection of `Person` entities
in the LightRAG knowledge graph.

## Why

Neural Composer sends each note's raw text to a LightRAG server, which
extracts entities (people, places, concepts, etc.) using an LLM. That
extraction can:

- **miss** people who are mentioned briefly or indirectly in a note, and
- **split** the same person into multiple graph nodes when they're
  referred to differently across notes (e.g. "Peter" in one note, "Peter
  Host" in another).

If you already know who a note is about, you can now tell the plugin
directly via frontmatter instead of relying entirely on LLM extraction.

## How to use it

Add a `people` field to a note's frontmatter, listing the canonical names
you want recognized:

```yaml
---
people: [Alice Dupont, Bob Martin]
---
```

A single name also works, using either key:

```yaml
---
person: Alice Dupont
---
```

Names are trimmed and de-duplicated automatically. This has no effect on
non-markdown files (`.txt`, `.pdf`, etc.) — frontmatter parsing only
applies to `.md` notes.

## What happens at ingestion

There are two independent levels of behavior:

### 1. Text hint (always on, no setting required)

Whenever a `.md` file with declared people is ingested — via the "Ingest
current file into knowledge graph" command, bulk folder ingestion, or
incremental vault sync — the plugin injects a normalized sentence right
after the note's title, before sending the content to LightRAG:

```
Title: My Note

People mentioned in this note: Alice Dupont, Bob Martin.

<original note body...>
```

This costs nothing extra (no additional HTTP calls) and works regardless
of whether your LightRAG server is local or remote. It simply gives the
LLM-based extraction a clearer, consistently-worded signal to work with.

### 2. Direct entity creation (opt-in setting)

Go to **Settings → Neural Composer → Graph & Vault → "Create people from
frontmatter"** and enable the toggle to turn on a stronger guarantee: once
LightRAG finishes processing an ingested note, the plugin checks each
declared name against the graph (`GET /graph/entity/exists`) and, if it's
missing, creates it directly as a `Person` entity (`POST
/graph/entity/create`) — independent of whether the LLM extraction found
it in the text.

This is off by default because:

- it makes extra HTTP calls per ingested file (one `exists` check, plus a
  `create` call only for missing names), and
- the two endpoints it relies on are not present on every LightRAG server
  version. If your server doesn't support them, the calls fail silently
  (a warning is logged to the console) and ingestion is unaffected — you
  simply don't get the stronger guarantee, only the text hint from level 1.

## Relationship to the existing "Custom Ontology" setting

This feature is independent of, but complementary to, the existing
**Custom Ontology** setting (Settings → Graph & Vault → Ontology section).
That setting controls which entity *types* LightRAG recognizes at all
(`Person, Creature, Organization, ...` by default) via a server-side
`.env` variable, and requires a full re-ingestion of your vault to take
effect. This feature assumes `Person` is already one of your configured
entity types (it is, by default) and works at the level of individual
notes without needing to touch your ontology or restart the server.

Unlike the Ontology section, "Create people from frontmatter" is **not**
limited to desktop or local servers — since it's plain HTTP to your
configured LightRAG server URL, it works with a remote server too.

## Limitations

- Declaring a person in frontmatter does not create relationships between
  that person and other entities in the note automatically — it only
  guarantees the entity itself exists (or nudges extraction toward
  finding it). Relationships are still inferred by LightRAG's own
  extraction from the note body.
- If a declared name doesn't exactly match how LightRAG's extraction
  names the "same" person elsewhere in your graph, you may end up with
  two separate nodes. Use LightRAG's own merge tooling (available from the
  graph view, right-click → merge) to consolidate duplicates.
- The direct-creation endpoints (`/graph/entity/exists`,
  `/graph/entity/create`) are recent additions to LightRAG's API surface
  and may not exist on older self-hosted servers — see level 2 above.
