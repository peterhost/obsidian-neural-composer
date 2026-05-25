# Installation

This page walks you through the full setup from scratch.

---

## Prerequisites

| Requirement  | Minimum version | Notes                                               |
| :----------- | :-------------- | :-------------------------------------------------- |
| **Python**   | 3.10            | 3.11 or 3.12 recommended                           |
| **Obsidian** | 1.7.2           | Desktop only (mobile is not supported)             |
| **pip**      | any recent      | Comes with Python; update with `pip install -U pip` |

---

## Step 1 — Install LightRAG

LightRAG ships a ready-to-use API server. **We strongly recommend a virtual environment** to keep it isolated from other Python projects:

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

> **Windows note:** If `python` is not found, try `python3` or use the full path from the Microsoft Store install. On some Windows setups, `py -3.11 -m venv` is more reliable.

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

> **Tip:** If you used a virtual environment, the path lives inside the venv's `bin/` (macOS/Linux) or `Scripts/` (Windows) directory. You must use the full absolute path, not just `lightrag-server`, because the plugin does not inherit your shell's `PATH`. Paths with spaces must be wrapped in quotes in some OS configurations.

---

## Step 3 — Install the plugin

### Option A: Community Plugin Store (recommended)

Neural Composer is published on the official Obsidian community plugin marketplace.

1. In Obsidian, open **Settings → Community plugins**.
2. Make sure **Restricted mode** is off.
3. Click **Browse** and search for **"Neural Composer"**.
4. Click **Install**, then **Enable**.

[screenshot: Obsidian Community plugins Browse panel with "Neural Composer" in the search field and the Install button visible]

### Option B: Manual install

Use this if you need a specific release that isn't yet on the store, or want to test a pre-release build.

1. Go to the [Releases page](https://github.com/oscampo/obsidian-neural-composer/releases) and download `main.js`, `manifest.json`, and `styles.css` from the desired release.
2. In your vault, create the folder `.obsidian/plugins/neural-composer` (create it if it doesn't exist).
3. Copy the three downloaded files into that folder.
4. In Obsidian: **Settings → Community plugins → Installed plugins**, find Neural Composer and toggle it on.

[screenshot: Finder / Explorer showing the three files (main.js, manifest.json, styles.css) inside the .obsidian/plugins/neural-composer folder]

---

## Step 4 — First-run checklist

After enabling the plugin, open **Settings → Neural Composer**. The panel opens with a sidebar of seven tabs.

[screenshot: Neural Composer settings panel — full view showing the sidebar tabs on the left]

Work through this checklist in order:

- [ ] **Providers tab** — Enter at least one AI provider API key (or configure Ollama if you want a fully local setup).
- [ ] **Models tab** — Select a chat model and an embedding model.
- [ ] **Graph & Vault tab** — Paste the `lightrag-server` path from Step 2 into the **Command Path** field.
- [ ] **Graph & Vault tab** — Choose a **Data Directory** where graph files will be stored. This can be anywhere on disk — it does not need to be inside the vault. Use a dedicated, empty folder.
- [ ] **Graph & Vault tab** — Optionally set a **Watched Folder** to enable auto-sync on save.
- [ ] Toggle **Auto-start** to on.
- [ ] Click **Restart Server** and wait for the status bar dot to turn green.

[screenshot: status bar bottom-right showing a green dot next to "Neural Composer"]

- [ ] Right-click a folder in the file explorer and choose **Add to graph** to ingest your first notes.

[screenshot: right-click context menu on a vault folder showing the "Add to graph" option]

If the status bar dot stays red after clicking Restart, see the [Troubleshooting](Troubleshooting) page.
