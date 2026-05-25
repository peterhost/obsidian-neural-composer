# Installation

This page walks you through the full setup from scratch.

---

## Prerequisites

| Requirement           | Minimum version | Notes                                              |
| :-------------------- | :-------------- | :------------------------------------------------- |
| **Python**            | 3.10            | 3.11 or 3.12 recommended                          |
| **Obsidian**          | 1.7.2           | Desktop only (mobile is not supported)            |
| **pip**               | any recent      | Comes with Python; update with `pip install -U pip` |

---

## Step 1 — Install LightRAG

LightRAG ships a ready-to-use API server. Install it with:

```bash
pip install "lightrag-hku[api]"
```

**We strongly recommend a virtual environment** so this doesn't interfere with other Python projects:

```bash
python -m venv ~/.venvs/lightrag
source ~/.venvs/lightrag/bin/activate      # macOS / Linux
# or
~\.venvs\lightrag\Scripts\activate         # Windows PowerShell

pip install "lightrag-hku[api]"
```

Once installed, verify the server binary exists:

```bash
lightrag-server --version
```

---

## Step 2 — Find the `lightrag-server` path

The plugin needs the **absolute path** to the `lightrag-server` executable. Find it with:

```bash
# macOS / Linux
which lightrag-server
# example output: /Users/you/.venvs/lightrag/bin/lightrag-server

# Windows (PowerShell)
where.exe lightrag-server
# example output: C:\Users\you\.venvs\lightrag\Scripts\lightrag-server.exe
```

Copy this path — you will paste it into the plugin settings in Step 4.

> **Tip:** If you used a virtual environment, the path lives inside the venv's `bin/` (macOS/Linux) or `Scripts/` (Windows) directory. You must use the full absolute path, not just `lightrag-server`, because the plugin does not inherit your shell's `PATH`.

---

## Step 3 — Install the plugin

### Option A: BRAT (recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) lets you install and update Neural Composer directly from GitHub without waiting for the community plugin store.

1. Install **BRAT** from the Obsidian community plugin store.
2. Open BRAT settings and click **Add Beta Plugin**.
3. Paste `oscampo/obsidian-neural-composer` and confirm.
4. BRAT downloads and enables the plugin automatically.

### Option B: Manual install

1. Go to the [Releases page](https://github.com/oscampo/obsidian-neural-composer/releases) and download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create the folder `.obsidian/plugins/neural-composer` inside your vault (create it if it doesn't exist).
3. Copy the three files into that folder.
4. In Obsidian: **Settings → Community plugins → Installed plugins**, find Neural Composer and toggle it on.

---

## Step 4 — First-run checklist

After enabling the plugin, open **Settings → Neural Composer** and work through this list:

- [ ] **Providers tab** — Enter at least one AI provider API key (or configure Ollama if you want a fully local setup).
- [ ] **Models tab** — Select a chat model and an embedding model.
- [ ] **Graph & Vault tab** — Paste the `lightrag-server` path from Step 2 into the **Command Path** field.
- [ ] **Graph & Vault tab** — Choose a **Data Directory** where the graph files will be stored (can be anywhere on disk, does not need to be inside the vault).
- [ ] **Graph & Vault tab** — Optionally set a **Watched Folder** to enable auto-sync.
- [ ] Toggle **Auto-start** to on.
- [ ] Click **Restart Server** and wait for the status bar dot to turn green.
- [ ] Right-click a folder in the file explorer and choose **Add to graph** to ingest your first notes.

If the status bar dot stays red, see the [Troubleshooting](Troubleshooting) page.
