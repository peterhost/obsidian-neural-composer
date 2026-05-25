# Configuration

The settings panel (**Settings → Neural Composer**) has a sidebar with seven tabs. This page explains each one.

---

## Providers

This is where you tell the plugin which AI providers you have access to and enter the corresponding API keys.

**Supported providers:**

| Provider        | Type   | Notes                                              |
| :-------------- | :----- | :------------------------------------------------- |
| OpenAI          | Cloud  | GPT-4o, GPT-4.1, o3, etc.                        |
| Anthropic       | Cloud  | Claude 3.x / 4.x models                          |
| Gemini          | Cloud  | Google's Gemini family                            |
| Groq            | Cloud  | Fast inference, Llama/Mixtral models              |
| Deepseek        | Cloud  | Deepseek-chat and Deepseek-reasoner               |
| Mistral         | Cloud  | Mistral and Mixtral models                        |
| Perplexity      | Cloud  | Search-augmented models                           |
| OpenRouter      | Cloud  | Unified gateway to many providers                 |
| Ollama          | Local  | Fully offline; no API key required                |
| LM Studio       | Local  | Local model runner with an OpenAI-compatible API  |
| Morph           | Cloud  | Code-focused model for the Apply step             |

For each cloud provider, paste the API key into the corresponding field. Keys are stored only in Obsidian's local `data.json` and never sent anywhere except the provider's own API.

For Ollama and LM Studio, enter the base URL of their local API server (defaults are `http://localhost:11434` and `http://localhost:1234` respectively). No API key is needed.

---

## Models

Three model slots to configure:

| Slot                | Purpose                                                                                   |
| :------------------ | :---------------------------------------------------------------------------------------- |
| **Chat model**      | Answers your questions in the chat pane. Pick whatever gives you the best quality/cost.   |
| **Apply model**     | Used when applying a suggested edit back into your note. A fast, cheap model works well.  |
| **Embedding model** | Converts text to vectors for similarity search. Must match what LightRAG expects.         |

After changing the embedding model, you should re-ingest your notes so the stored embeddings stay consistent.

---

## Graph & Vault

This tab controls the LightRAG backend and vault integration.

### Local vs remote server

By default the plugin runs `lightrag-server` as a subprocess on your machine. If you toggle **Use remote server**, a URL field appears. Enter the base URL of your remote LightRAG instance (e.g., `http://192.168.1.50:9621`). The plugin will send all graph queries and ingestion requests to that URL instead of spawning a local process.

### Command path

The absolute path to the `lightrag-server` binary. See [Installation](Installation) for how to find this. This field is only relevant when using a local server.

### Data directory

The folder where LightRAG stores the graph database, vector index, and cache files. This can be anywhere on your disk — it does not need to be inside your vault. Use a dedicated folder and don't put other files in it.

### Watched folder

When set, Neural Composer watches this vault folder for file changes. Every time you save a note inside it, the plugin queues it for re-ingestion (with a 5-second debounce). Renames and deletes are also handled: a renamed note is re-ingested under its new name, and a deleted note is removed from the graph.

Leave this blank if you prefer to ingest manually via right-click.

### Graph logic model

The LLM used by LightRAG internally to extract entities and relationships during ingestion. This is separate from your chat model. A cost-efficient model (e.g., `gemini-flash` or `gpt-4o-mini`) is usually fine here.

### Embedding model (server-side)

The embedding model LightRAG uses on the server side. Must be consistent with what was used when the graph was first built. Changing this and re-ingesting will rebuild the vector index.

### Summary language

The language LightRAG uses when writing entity summaries into the graph. Defaults to English. Change this if your notes are primarily in another language.

### Citations toggle

When enabled, chat responses include numbered citation markers (e.g., `[1]`) linked to the source documents and text chunks that were retrieved. Disable if you find citations cluttering the output.

### Auto-start

When on, the plugin starts `lightrag-server` automatically when Obsidian opens, and stops it when Obsidian closes. Recommended for most users.

---

## Advanced

### .env editor

LightRAG is configured via a `.env` file in its data directory. The Advanced tab includes a text editor for this file so you can set options that the UI doesn't expose directly (e.g., `LIGHTRAG_KV_STORAGE`, `LIGHTRAG_GRAPH_STORAGE`).

### Custom environment variables

Add arbitrary `KEY=VALUE` pairs that are injected into the LightRAG server's environment on startup. Useful for proxy settings or provider-specific options.

### Performance tuning

| Setting          | What it does                                                                                       |
| :--------------- | :------------------------------------------------------------------------------------------------- |
| **Chunk size**   | How many characters each text chunk contains before being embedded. Larger = more context per chunk, but more tokens per embedding call. |
| **Chunk overlap** | How many characters overlap between consecutive chunks. Helps avoid splitting concepts across chunk boundaries. |
| **Async workers** | Number of parallel workers LightRAG uses during ingestion. Higher = faster ingestion, higher API concurrency. |

---

## Tools (MCP)

Neural Composer can expose your vault's knowledge graph to external AI clients via the [Model Context Protocol](https://modelcontextprotocol.io/).

### Adding an MCP server

Each MCP server entry has:

- **Name** — A label for your own reference.
- **Transport** — `stdio` or `sse`. Use `stdio` for local clients (Claude Desktop); use `sse` for network-accessible servers.
- **Command / URL** — For `stdio`: the command to launch the MCP client bridge. For `sse`: the URL of the SSE endpoint.
- **Arguments** — Additional arguments passed to the command (stdio only).
- **Environment** — Key/value pairs injected when the command is started (stdio only).

### Claude Desktop example

To expose your graph to Claude Desktop, add an entry with transport `stdio` and point the command at the Neural Composer MCP bridge. Then add the corresponding entry in Claude Desktop's `claude_desktop_config.json`. The wiki [Features](Features) page has more detail.

---

## Help

The Help tab contains quick-start guidance, links to this wiki, and the plugin version. Nothing to configure here — it's a reference panel you can open without leaving Obsidian.
