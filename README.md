# Neural Composer
**Deep, graph-based search for your Obsidian Vault.**

![Hero Banner](https://raw.githubusercontent.com/oscampo/obsidian-neural-composer/main/images/hero-banner.GIF)

## 👋 Hello, Obsidian Community!

We built **Neural Composer** because we love Obsidian, but we often felt limited by standard search tools.

Have you ever searched for a topic in your vault and gotten a list of notes that contain the _word_, but miss the _context_? Or tried to ask an AI plugin a complex question, only for it to fail because it couldn't "see" the connections between your files?

**We wanted a way to talk to our notes that felt like talking to someone who actually remembers them.**

That's why we integrated **LightRAG** (Graph-based Retrieval) into Obsidian. Unlike standard plugins that just look for matching text chunks, Neural Composer builds a **Knowledge Graph** of your ideas, helping you find relationships you might have forgotten.

---

## 🤔 Why use Graph RAG?

Standard AI search (Vector RAG) is great for finding _similar text_. But **Graph RAG** is better for finding _connected ideas_.

| Feature            | Standard Vector Search                  | Neural Composer (Graph)                      |
| :----------------- | :-------------------------------------- | :------------------------------------------- |
| **How it searches** | Finds matching keywords/concepts        | Follows relationships between entities       |
| **Best for**        | Simple questions ("What is X?")         | Complex questions ("How does X influence Y?") |
| **Context**         | Often fragmented                        | Holistic and interconnected                  |

---

## 🛠️ How it helps (Use Cases)

We designed this to fit into different workflows. Here is how it might help you:

- **For Researchers:** If you have hundreds of papers, you can ask it to synthesize arguments across multiple authors, finding consensus or contradictions that a simple search would miss.
- **For Writers & DMs:** If you are building a world or a story, the graph tracks the relationships between characters and lore, helping you maintain consistency without digging through folders.
- **For Daily Journalers:** It connects entries from months ago to today, helping you spot patterns in your life or work that aren't obvious day-to-day.
- **For Project Managers:** It helps visualize dependencies between different project notes that might otherwise look like separate tasks.

---

## Features

We wanted the experience to be as smooth as possible:

- **⚡ Automated Server:** No need to fiddle with terminals. The plugin handles the background Python server for you (starts and stops automatically).
- **Hybrid Search:** You don't have to choose. It combines Vector search with Graph traversal for the best results.
- **Easy Ingestion:** Right-click any folder to add your notes to the graph. It supports PDFs, DOCX, and more... <details> <summary> Complete list of supported formats </summary> md, txt, docx, pdf, pptx, xlsx, rtf, odt, epub, html, htm, xml, json, yaml, yml, csv, tex, log, conf, ini, properties, sql, bat, sh, c, cpp, py, java, js, ts, swift, go, rb, php, css, scss, less </details>
- **🔍 Transparency:** The chat shows you exactly which files and text segments were used to generate the answer (with citations like `[1]`), so you can always verify the source.
- **🔒 Local & Private:** You can use local models (like Ollama) for a completely offline experience, or connect to Gemini/OpenAI if you prefer.
- **📂 Vault Sync & Document Status** _(v1.3+)_: Set a watched folder and your notes are automatically re-indexed whenever you save them (with a 5-second debounce to avoid hammering the server). Colored dots appear directly in the file explorer next to each note: 🟢 processed, 🟡 processing or failed, 🔵 removed from graph. The watched folder itself shows an aggregate dot so you can see the overall state at a glance.
- **🌐 Remote Server Support** _(v1.3+)_: Not running LightRAG on your main machine? Connect the plugin to a LightRAG server running on another machine — a NAS, a VPS, or a Docker container. Toggle it on in **Settings → Graph & Vault** and enter the remote URL.
- **🔍 Knowledge Graph Visualization** _(v1.3+)_: Explore your knowledge graph visually inside Obsidian, in 2D or 3D. **Overview mode** renders all nodes in the graph. **Explore mode** starts a BFS from any entity you pick, so you can trace how ideas connect.
- **🤖 MCP Tools** _(v1.3+)_: Expose your graph to any MCP-compatible AI client (Claude Desktop, and others) through configurable MCP servers. Ask your favorite AI client questions that are answered straight from your vault's knowledge graph.

---

## Getting Started

> Full documentation on the [wiki](https://github.com/oscampo/obsidian-neural-composer/wiki)

This plugin requires a small backend setup (Python) to run the LightRAG engine.

### 1. One-time Setup

1. Ensure you have **Python 3.10+** installed.
2. Install the engine via terminal:
   ```bash
   pip install "lightrag-hku[api]"
   ```
   _(We recommend using a virtual environment)._

### 2. Install the Plugin

- Recommended: install via **BRAT**
- Manual Installation:
  Download `main.js`, `manifest.json`, and `styles.css` from the **[Releases](../../releases)** page and place them in your `.obsidian/plugins/neural-composer` folder. Enable it in Obsidian.

### 3. Connect & Go

Go to **Settings → Neural Composer**. The settings panel has a sidebar with seven tabs.

1. **Providers** tab: enter your API keys for whichever AI providers you use (OpenAI, Anthropic, Gemini, Ollama, etc.).
2. **Models** tab: choose your chat model, apply model, and embedding model.
3. **Graph & Vault** tab:
   - Set the path to your `lightrag-server` executable.
   - Choose a data directory where the graph will be stored.
   - Optionally set a **watched folder** so notes are auto-synced whenever you save.
4. Toggle **Auto-start** and click **Restart Server**.

You are ready! Right-click any folder to ingest your notes and start chatting with your vault.

---

## 🧩 Advanced Options

For those who like to tinker, we added some power features:

- **Watched Folder & Status Dots:** Configure a folder to be automatically kept in sync with the graph. Colored dots in the file explorer show each note's current graph status (🟢 processed, 🟡 processing/failed, 🔵 removed) so you always know what's indexed.
- **Remote Server Mode:** Point the plugin at a LightRAG instance running on a different machine (NAS, VPS, Docker). Useful for teams or for offloading processing to a more powerful box.
- **Custom Ontology:** Teach the graph the specific categories of your field (e.g., "Experiment", "Theorem") instead of generic ones.
- **Reranking:** Connect to Jina AI, Cohere, or a custom reranker endpoint for higher-precision results.
- **MCP Tools Integration:** Expose your vault's knowledge graph to any MCP-compatible AI client. Configure MCP servers in the **Tools (MCP)** settings tab.
- **Knowledge Graph Visualization:** Open an interactive 2D or 3D view of your graph from within Obsidian. Use Overview mode to see everything, or Explore mode to do a BFS walk from a specific entity.

---

## 🔒 Privacy & Security

Neural Composer is designed with privacy as a core principle. Here is an exact account of every network call the plugin makes and why.

### What leaves your machine

| Destination                                                  | When                                    | Why                                                                                                                         |
| :----------------------------------------------------------- | :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Your AI provider** (OpenAI, Anthropic, Gemini, Groq, etc.) | Every chat message or ingestion         | To generate responses and embeddings. Only the notes you explicitly ingest or attach are sent.                              |
| **Your local LightRAG server** (`localhost`)                 | Every query and ingestion               | The plugin talks to the LightRAG Python process running on your own machine. No data leaves.                               |
| **Your custom / remote LightRAG server**                     | Only if you configure a remote URL      | If you opt in to a remote server, queries go to that URL. This is off by default.                                          |

**If you use local models (Ollama) and a local LightRAG server, no data ever leaves your machine.**

### What never happens

- The plugin **does not send telemetry, analytics, or crash reports** to any server.
- The plugin **does not contact `github.com` or any other domain at runtime.** GitHub URLs visible in the settings UI are navigation links only — they are never fetched programmatically.
- The plugin **does not store your API keys anywhere other than Obsidian's own `data.json`** in your local vault.

### System-level access (Obsidian scorecard disclosures)

The Obsidian automated scanner flags several capabilities. Here is the plain-English explanation for each:

| Disclosure                              | Why it exists                                                                                                                                                                                   |
| :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Direct filesystem access (`fs`)**     | Required to write the LightRAG `.env` configuration file to your chosen work directory, which may be outside the vault.                                                                         |
| **Shell execution (`child_process`)**   | Required to start and stop the local LightRAG Python server. The command is the exact path you configure in settings — no user input is ever interpolated into shell arguments.                 |
| **Vault enumeration**                   | Required to list your notes for ingestion and for the RAG search index. Only metadata (file paths) is read; content is read only when you explicitly ingest a file.                            |
| **Clipboard access**                    | Inherited from the Lexical rich-text editor used in the chat input. Allows standard paste operations.                                                                                          |
| **Base64 calls (`atob`/`btoa`)**        | Used by bundled dependencies: `@modelcontextprotocol/sdk` decodes JWT tokens for MCP OAuth, and `sigma`/`three-forcegraph` encode WebGL shader data. No API keys or sensitive data are encoded this way. |
| **Dynamic code execution (`new Function`)** | Used by two bundled libraries: `ngraph.forcelayout` generates optimized N-dimensional physics code for the 3D graph, and `ajv` (via the MCP SDK) compiles JSON schema validators. Neither is used to execute user-provided code. |

---

This project is a labor of love, built upon the shoulders of giants:

- Forked from the excellent **[Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)** by glowingjade.
- Powered by the **[LightRAG](https://github.com/HKUDS/LightRAG)** library.
- Developed by **Oscar Campo** & **Cora** (AI).

We hope this helps you connect the dots in your own second brain. Happy composing!
