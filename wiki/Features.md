# Features

Deep dives into each major feature of Neural Composer.

---

## Chat with Graph

The chat pane is the primary interface for querying your knowledge graph. Open it via the ribbon icon or the command palette (`Neural Composer: Open chat`).

### Query modes

LightRAG supports several retrieval strategies. You can select the mode from the dropdown in the chat toolbar:

| Mode       | What it does                                                                                                              |
| :--------- | :------------------------------------------------------------------------------------------------------------------------ |
| **local**  | Retrieves the most relevant text chunks by vector similarity. Fast; best for precise factual questions.                   |
| **global** | Traverses the knowledge graph to find entity relationships. Best for broad, synthesizing questions.                       |
| **hybrid** | Combines local and global. The recommended default for most questions.                                                    |
| **naive**  | Plain vector search without graph traversal. Useful for comparing output quality against the graph-aware modes.           |
| **mix**    | A weighted blend of all strategies. Can produce the richest answers but uses more tokens.                                 |
| **bypass** | Skips retrieval entirely and sends your message directly to the LLM. Useful for general questions unrelated to your vault. |

### Citations

When citations are enabled (Settings → Graph & Vault → Citations), each response includes numbered markers like `[1]`. Click a marker to jump to the source chunk and the file it came from. This lets you verify any claim the model makes.

---

## Document Status Tracking

Every note that has been through the ingestion pipeline has a status tracked by the plugin. Status is shown as a colored dot in the file explorer, next to the file name.

### What the dots mean

| Color | Status      | Meaning                                                                                     |
| :---- | :---------- | :------------------------------------------------------------------------------------------ |
| 🟢    | processed   | The note has been successfully ingested and is part of the knowledge graph.                 |
| 🟡    | processing  | The note is currently queued or being ingested. Also shown if the last ingestion failed.    |
| 🔴    | failed      | Ingestion completed but an error was recorded. Re-process to retry.                        |
| 🔵    | removed     | The note was explicitly removed from the graph (via right-click → Remove from graph).       |

The watched folder itself shows an **aggregate dot**: green if all notes inside are processed, yellow if any are pending or failed, and so on.

### How to re-process a note

Right-click the file in the file explorer and choose **Add to graph**. This queues it for ingestion regardless of its current status.

### How to remove a note from the graph

Right-click the file and choose **Remove from graph**. The dot turns blue and the note's data is deleted from the LightRAG index.

---

## Knowledge Graph Visualization

Open the graph view via the command palette: `Neural Composer: Open knowledge graph`. The view opens as a new pane inside Obsidian.

### Overview mode

Renders all entities (nodes) and relationships (edges) currently in the graph. Node size reflects the number of connections. Useful for getting a bird's-eye view of how your ideas cluster.

Use the toolbar to switch between **2D** (canvas-based, faster) and **3D** (WebGL, more immersive). In 3D, you can orbit, zoom, and pan with the mouse.

### Explore mode

Click **Explore** in the toolbar and type an entity name. The view performs a breadth-first search (BFS) from that entity, showing its immediate neighbors and then their neighbors, up to a configurable depth. This lets you trace how a specific idea connects to the rest of your vault without drowning in the full graph.

Click any node to re-center the BFS on that entity.

---

## Vault Sync

Vault Sync keeps the knowledge graph in step with your notes as you write, without manual ingestion steps.

### Setup

Set a **Watched Folder** in Settings → Graph & Vault. This should be a vault folder (or the vault root) that contains the notes you want to keep indexed.

### Auto-re-index on save

Whenever you save a note inside the watched folder, Neural Composer queues it for re-ingestion. A **5-second debounce** prevents rapid saves (e.g., while typing) from flooding the server — only the final save after you stop typing triggers the ingestion.

The status dot next to the file turns 🟡 while ingestion is in progress and 🟢 when it completes.

### Rename handling

If you rename a note, the plugin removes the old document from the graph and re-ingests it under the new name. Relationships established under the old name are rebuilt.

### Delete handling

If you delete a note, it is automatically removed from the graph. The status dot disappears along with the file.

### Disabling auto-sync

To stop watching a folder, clear the **Watched Folder** field in settings. You can still ingest notes manually at any time via right-click → Add to graph.
