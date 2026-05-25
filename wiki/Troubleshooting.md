# Troubleshooting

Solutions to the most common problems. If your issue isn't listed here, [open an issue](https://github.com/oscampo/obsidian-neural-composer/issues) with the server log (copy it from the **Advanced** tab's log panel).

---

## Status bar dot is red — server offline

The red dot in the status bar means the plugin cannot reach the LightRAG server.

**Check these things in order:**

1. **Command path is set.** Go to Settings → Neural Composer → Graph & Vault and confirm the **Command Path** field contains the full absolute path to `lightrag-server`. If it is blank, see [Installation](Installation) Step 2.
2. **The binary exists at that path.** Open a terminal and run the path directly (e.g., `/Users/you/.venvs/lightrag/bin/lightrag-server --version`). If you get "No such file or directory", the path is wrong or the venv was deleted.
3. **Auto-start is toggled on.** If Auto-start is off, click **Restart Server** manually.
4. **Port conflict.** LightRAG defaults to port `9621`. If another process is using that port, the server will fail to start. Check with `lsof -i :9621` (macOS/Linux) or `netstat -ano | findstr 9621` (Windows).
5. **Check the server log.** The Advanced tab shows the raw stdout/stderr from the LightRAG process. Look for Python tracebacks or error messages.

---

## "lightrag-server: command not found"

This error appears in the server log when the **Command Path** field is empty or contains just `lightrag-server` without a full path.

The plugin does not inherit your shell's `PATH`, so short names do not work. You must enter the absolute path.

Run `which lightrag-server` (macOS/Linux) or `where.exe lightrag-server` (Windows) in the terminal where LightRAG is installed to get the full path.

---

## Documents stuck in 'processing'

A 🟡 dot that stays yellow for more than a few minutes usually means the ingestion pipeline stalled.

**What to do:**

1. Check the server log (Advanced tab) for errors. Common causes are API key errors (see below) and network timeouts.
2. LightRAG's pipeline is watched internally. If a document gets stuck, the plugin will attempt to re-queue it automatically on the next server connect.
3. If the dot stays yellow after restarting the server, right-click the file and choose **Add to graph** to force a fresh ingestion attempt.

---

## Documents show 'unknown' status after restart

After Obsidian restarts, document statuses may briefly show as unknown (no dot or a grey indicator) before syncing. This is expected behavior — the plugin re-reads the status index from the LightRAG server on the first successful connection after startup. Status dots will populate once the server responds.

If statuses do not appear after a minute and the server dot is green, try closing and reopening the affected folder in the file explorer.

---

## API key errors (401 Unauthorized)

A `401` error in the server log means LightRAG is rejecting the API key for the graph logic model or embedding model.

**Check:**

1. Go to Settings → Neural Composer → Providers. Confirm the API key for the provider you selected in Graph & Vault is entered and correct.
2. Some providers (e.g., Groq, OpenRouter) use different key formats or require the key in the `Authorization: Bearer` header. Verify in the provider's dashboard that the key is active.
3. If you recently rotated your API key, update it in the Providers tab and click **Restart Server** to pick up the change.

---

## All documents re-processing after vault rename or move

If you rename or move your vault folder, Neural Composer may decide all notes need to be re-ingested. This happens because the plugin tracks documents by their full path, and a vault rename changes every path at once.

**Why it happens and how it resolves:**

The plugin uses a modification-time (`mtime`) check combined with a path-based `needsIngestion` check. When the vault path changes, paths no longer match stored records, so the plugin marks everything for re-ingestion. This is by design — LightRAG needs consistent source paths for correct citation linking.

Re-ingestion after a vault rename is a one-time event. Let it complete (the status dots will cycle through 🟡 → 🟢). Future saves will only re-ingest files you actually change.

If re-ingestion is taking too long and you just did an accidental rename/undo, restart Obsidian before the pipeline finishes to cancel the queue.
