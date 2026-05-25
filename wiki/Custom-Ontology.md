# Custom Ontology

By default, LightRAG extracts a broad set of entity types from your notes: `Person`, `Organization`, `Location`, `Event`, `Concept`, and so on. Custom Ontology lets you replace this default set with types specific to your domain, so the graph reflects the vocabulary of your work.

---

## Why it matters

The entity types you define shape what LightRAG pays attention to during ingestion. With the default types, a machine learning researcher's notes will generate `Person` (authors) and `Concept` (algorithms), but miss domain-specific categories like `Dataset`, `Experiment`, or `Benchmark`. A novelist's notes will miss `Character` and `PlotArc`.

Defining the right entity types produces a graph that is:
- More precisely structured around your domain
- Better at multi-hop reasoning across domain-specific relationships
- Easier to explore in the graph visualization (nodes are categorized correctly)

---

## LightRAG v1.4.x — inline entity types

> If you are on LightRAG v1.5+, skip to the next section.

1. Open **Settings → Neural Composer → Graph & Vault → Ontology**.
2. Toggle **Use custom entity types** on.
3. Edit the comma-separated list in the textarea.

[screenshot: Ontology section with toggle enabled and a textarea containing "Person, Dataset, Experiment, Benchmark, Method, Paper, Institution"]

**Format:** comma-separated type names, singular, title-case. Example:

```
Person, Organization, Dataset, Experiment, Method, Benchmark, Paper, Venue, Metric
```

LightRAG will prioritize extracting entities of these types. Types you omit will still be extracted occasionally if LightRAG finds a clear match, but the focus shifts to your list.

### Tips for choosing entity types

- **Keep it to 8–15 types.** Too many reduces extraction precision.
- **Use singular forms.** `Person` not `People`.
- **Be specific enough to be useful, but not so narrow that nothing matches.** `ResearchPaper` is better than `ArxivPaper2024`.
- **Test with a small folder first** before re-ingesting your entire vault.

### Domain examples

| Domain | Suggested entity types |
| :--- | :--- |
| Academic research | `Person, Institution, Paper, Dataset, Method, Benchmark, Metric, Concept, Venue` |
| Fiction writing | `Character, Location, Organization, Event, Artifact, Concept, PlotArc` |
| Software engineering | `System, Component, API, Concept, Person, Organization, Technology, Issue` |
| Game mastering (TTRPG) | `Character, Faction, Location, Artifact, Event, Creature, Lore, Session` |
| Personal knowledge | `Person, Concept, Project, Resource, Idea, Decision, Event` |

---

## LightRAG v1.5+ — jinja2 template file

LightRAG v1.5.0 replaced the `ENTITY_TYPES` environment variable with a file-based approach. Instead of a comma-separated list, you provide a **jinja2 template** that LightRAG uses when prompting the LLM during extraction.

When Neural Composer detects a v1.5+ server, the Ontology textarea is replaced with a **file path** field, and a migration banner appears in settings.

[screenshot: migration banner in Graph & Vault settings reading "⚡ LightRAG v1.5 detected — entity types now require a template file", with the new file path input below]

### Step 1 — Create the template file

Create a file called `entity_types.jinja2` (or any name you prefer) in your **Data Directory** — the same folder LightRAG uses to store the graph. The simplest template looks like this:

```jinja2
Your goal is to extract structured information from the following text.
Extract only entities of these types: {{ entity_types }}.

Focus on:
- Relationships between entities
- Properties and attributes of each entity
- Temporal or causal relationships where present

Text:
{{ input_text }}
```

LightRAG injects `entity_types` and `input_text` at runtime.

### Step 2 — Define your entity types in the template

To hardcode your custom types, replace `{{ entity_types }}` with your list directly:

```jinja2
Your goal is to extract structured information from the following text.
Extract only entities of these types:
Person, Dataset, Experiment, Method, Benchmark, Paper, Institution, Metric, Venue.

Focus on relationships, attributes, and temporal connections between these entities.

Text:
{{ input_text }}
```

### Step 3 — Point Neural Composer at the file

In **Settings → Graph & Vault → Ontology**, enter the full absolute path to the template file:

```
/Users/you/lightrag-data/entity_types.jinja2
```

[screenshot: Ontology section on v1.5+ — file path field with a path entered and a small "Verify file" button]

Click **Restart Server** to apply the change.

### Step 4 — Re-ingest your notes

Entity types only affect ingestion, not querying. After changing your template, you need to re-ingest notes for the new types to take effect. Right-click the watched folder → **Add to graph** to queue everything.

---

## Changing entity types on an existing graph

**You don't need to delete the graph to change entity types.** New and re-ingested notes will use the new types. Existing nodes in the graph retain their original types until those notes are re-ingested.

If you want the entire graph to use the new types:
1. Change the entity types / template.
2. Delete the LightRAG data directory contents (or use a fresh directory).
3. Re-ingest all notes.

This is a destructive operation — the graph is rebuilt from scratch — but it's the only way to guarantee consistency across all nodes.

---

## Ontology folder (optional)

The **Ontology folder** field (Settings → Graph & Vault → Ontology) lets you point LightRAG at a folder of additional context documents that inform entity extraction. For example, a folder of domain glossaries or reference documents.

LightRAG reads these files once at startup and uses them to improve entity disambiguation. This field is optional and separate from the template file.

[screenshot: Ontology section showing both the entity types file path field and the Ontology folder field below it]
