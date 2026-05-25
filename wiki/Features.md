# Features

Deep dives into each major feature of Neural Composer.

---

## Chat with Graph

The chat pane is the primary interface for querying your knowledge graph. Open it via the ribbon icon or the command palette (`Neural Composer: Open chat`).

[screenshot: chat pane — full view showing the input field, a query, and a response with citation markers]

### Query modes

LightRAG supports several retrieval strategies. Select the mode from the dropdown in the chat toolbar — or set a default in **Settings → Neural Composer → Graph & Vault → Query mode**.

| Mode       | What it does                                                                                                              |
| :--------- | :------------------------------------------------------------------------------------------------------------------------ |
| **local**  | Retrieves the most relevant text chunks by vector similarity. Fast; best for precise factual questions.                   |
| **global** | Traverses the knowledge graph to find entity relationships. Best for broad, synthesizing questions.                       |
| **hybrid** | Combines local and global. A strong general-purpose default.                                                              |
| **naive**  | Plain vector search without graph traversal. Useful for comparing output quality against graph-aware modes.               |
| **mix**    | Weighted blend of all strategies. Can produce the richest answers but uses more tokens.                                   |
| **bypass** | Skips retrieval entirely — sends your message straight to the LLM. Useful for general questions unrelated to your vault.  |

[screenshot: query mode dropdown in the chat toolbar, open, showing the six options]

### Citations

When citations are enabled (Settings → Graph & Vault → Citations), each response includes numbered markers like `[1]`. Click a marker to jump to the source chunk and the file it came from. This lets you verify any claim the model makes.

[screenshot: chat response with [1] [2] citation markers visible, and the "Context used" panel open below showing source file names and relevance scores]

### Chat options

The toolbar also exposes three toggles that apply to the current session:

| Toggle | What it does |
| :--- | :--- |
| **Include current file** | Attaches the content of the note open in the editor to your message. |
| **Enable tools** | Lets the model call MCP tools and built-in vault tools (read, edit, create notes). |

### System prompt

Set a standing instruction in **Settings → Chat → System prompt**. It is prepended to every request before your message. Examples:
- `Always answer in Spanish.`
- `Be concise. No bullet points.`
- `You are my research assistant for machine learning papers.`

---

## Right-click context menu

Neural Composer adds actions to the file explorer's right-click menu for both folders and individual files.

[screenshot: right-click context menu on a vault folder, showing "Add to graph" and other Neural Composer options]

### On a folder

| Action | What it does |
| :--- | :--- |
| **Add to graph** | Recursively ingests all supported files in the folder and its subfolders. |

### On a file

| Action | What it does |
| :--- | :--- |
| **Add to graph** | Ingests this single file, regardless of its current status. |
| **Remove from graph** | Deletes this file's data from the LightRAG index. The status dot turns 🔵. The file itself is not deleted. |

> **Supported formats:** `md` `txt` `docx` `pdf` `pptx` `xlsx` `rtf` `odt` `epub` `html` `htm` `xml` `json` `yaml` `yml` `csv` `tex` `log` `conf` `ini` `properties` `sql` `bat` `sh` `c` `cpp` `py` `java` `js` `ts` `swift` `go` `rb` `php` `css` `scss` `less`

---

## Document Status Tracking

Every note that has been through the ingestion pipeline has a status tracked by the plugin. Status is shown as a colored dot in the file explorer, next to the file name.

[screenshot: file explorer panel showing several notes with colored dots (green, yellow, red, blue) next to their names]

### What the dots mean

| Color | Status      | Meaning                                                                                     |
| :---- | :---------- | :------------------------------------------------------------------------------------------ |
| 🟢    | processed   | The note has been successfully ingested and is part of the knowledge graph.                 |
| 🟡    | processing  | The note is currently queued or being ingested.                                             |
| 🔴    | failed      | Ingestion completed but an error was recorded. Re-process to retry.                        |
| 🔵    | removed     | The note was explicitly removed from the graph (via right-click → Remove from graph).       |

The watched folder itself shows an **aggregate dot**: 🟢 if all notes inside are processed, 🟡 if any are pending or failed.

### Reprocess failed documents

In **Settings → Graph & Vault**, the **Reprocess failed documents** button re-queues every file currently marked 🔴 for a fresh ingestion attempt. Useful after fixing an API key error or network issue that caused batch failures.

[screenshot: "Reprocess failed documents" button in the Graph & Vault settings tab]

---

## Knowledge Graph Visualization

Open the graph view via the command palette: `Neural Composer: Open knowledge graph`. The view opens as a new pane inside Obsidian.

[screenshot: graph view in Overview mode — showing a 2D force-directed graph with colored nodes and labeled edges]

### Overview mode

Renders all entities (nodes) and relationships (edges) currently in the graph. Node size reflects the number of connections. Useful for getting a bird's-eye view of how your ideas cluster.

Use the toolbar to switch between **2D** (canvas-based, faster) and **3D** (WebGL, more immersive). In 3D, you can orbit, zoom, and pan with the mouse.

[screenshot: 3D graph view — nodes floating in space with glow effects, mouse cursor near a node]

### Explore mode

Click **Explore** in the toolbar and type an entity name. The view performs a breadth-first search (BFS) from that entity, showing its immediate neighbors and then their neighbors up to a configurable depth. This lets you trace how a specific idea connects to the rest of your vault without drowning in the full graph.

Click any node to re-center the BFS on that entity.

[screenshot: Explore mode — one central node highlighted, with first- and second-degree neighbors visible, BFS depth indicator in the toolbar]

### 2D vs. 3D rendering

| | 2D | 3D |
|:---|:---|:---|
| **Rendering** | Canvas (CPU) | WebGL (GPU) |
| **Performance** | Fast even on large graphs | Heavier; best for < 5 000 nodes |
| **Interaction** | Pan + zoom | Orbit + zoom + pan |
| **Recommended for** | Daily use, large vaults | Exploration and presentations |

Switch in **Settings → Graph & Vault → Graph rendering engine**.

---

## Vault Sync

Vault Sync keeps the knowledge graph in step with your notes as you write, without manual ingestion steps.

### Setup

Set a **Watched Folder** in Settings → Graph & Vault. This should be a vault folder (or the vault root) that contains the notes you want to keep indexed.

[screenshot: "Watched folder" field in Graph & Vault settings with a folder path entered]

### Auto-re-index on save

Whenever you save a note inside the watched folder, Neural Composer queues it for re-ingestion. A **5-second debounce** prevents rapid saves (e.g., while typing) from flooding the server — only the final save after you stop triggers ingestion.

The status dot next to the file turns 🟡 while ingestion is in progress and 🟢 when it completes.

### Rename and delete handling

| Event | What happens |
| :--- | :--- |
| **Rename** | The old document is removed from the graph and re-ingested under the new name. |
| **Delete** | The note is automatically removed from the graph. The status dot disappears with the file. |
| **Move** | Treated as a delete + rename — removed from the old path, re-ingested at the new path. |

### Disabling auto-sync

Clear the **Watched Folder** field in settings. You can still ingest notes manually at any time via right-click → **Add to graph**.

---

## Reranking

Reranking runs a second-pass scoring model over the chunks retrieved from the graph before the LLM sees them. This improves result quality — especially on large graphs where the initial retrieval may surface marginally relevant chunks.

[screenshot: Reranking section in Graph & Vault settings — provider set to "Jina AI" with model and API key fields filled]

### When to use it

- Your graph has more than ~1 000 nodes and answers feel imprecise.
- You are using `mix` mode (all strategies) and want to filter down the best chunks.
- You have access to a local reranker (e.g., a FastAPI server wrapping a `cross-encoder` model) and want zero data leaving your machine.

### Supported providers

| Provider | Notes |
| :--- | :--- |
| **Jina AI** | Cloud. Default model: `jina-reranker-v2-base-multilingual`. Multilingual, good general-purpose. |
| **Cohere** | Cloud. Default model: `rerank-english-v3.0`. Strong on English technical content. |
| **Custom** | Any HTTP endpoint that accepts a list of (query, passage) pairs and returns ranked scores. |

### Custom local endpoint

Point **Host** at your local reranking server (e.g., `http://localhost:8080/rerank`). The API contract Neural Composer expects:

```
POST /rerank
{ "query": "...", "documents": ["...", "..."] }
→ { "results": [{ "index": 0, "score": 0.91 }, ...] }
```

---

## MCP Tools

Neural Composer connects to external [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) servers and makes their tools available inside the chat pane. This lets you combine your vault graph with external capabilities — GitHub, web search, filesystem access, and more — in a single conversation.

> Neural Composer is an MCP **client**. It connects *to* external servers; it does not expose itself as a server to applications like Claude Desktop.

[screenshot: Tools (MCP) tab showing a configured server entry with name and command visible]

For setup instructions and examples, see the [MCP Tools](MCP-Tools) page.

---

## Custom Ontology

By default, LightRAG extracts a broad set of entity types from your notes. Custom Ontology lets you teach it the vocabulary of your specific domain.

[screenshot: Ontology section in Graph & Vault — toggle enabled, textarea showing custom types like "Experiment, Theorem, Reagent, Author"]

For a full guide, see the [Custom Ontology](Custom-Ontology) page.
