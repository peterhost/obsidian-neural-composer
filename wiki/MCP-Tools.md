# MCP Tools

Neural Composer integrates with the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) as a **client**. This means you can connect external MCP servers to Neural Composer and use their tools directly from the chat pane — alongside your vault graph.

> **Note:** Neural Composer connects *to* external MCP servers. It does not currently expose your vault as an MCP server to external clients such as Claude Desktop. The Tools (MCP) tab is for adding tools *into* Neural Composer's chat, not for exposing Neural Composer to other applications.

---

## What you can do with MCP

When an MCP server is connected, its tools appear in the chat pane alongside the built-in vault tools. The model can call them automatically when **Enable tools** is on (Settings → Chat).

Example use cases:

| MCP server | What it adds to your chat |
| :--- | :--- |
| `@modelcontextprotocol/server-github` | Read issues, PRs, and code from a GitHub repo |
| `@modelcontextprotocol/server-filesystem` | Read and write files outside the vault |
| `@modelcontextprotocol/server-brave-search` | Web search from within the chat |
| Any custom MCP server | Whatever tools your server exposes |

[screenshot: chat pane — a tool call visible inline where the model called an MCP tool and shows its result before the final answer]

---

## Adding an MCP server

1. Open **Settings → Neural Composer → Tools (MCP)**.
2. Click **Add MCP server**.
3. Fill in the form:
   - **Name:** a label for your reference (e.g., `GitHub`)
   - **Parameters:** a JSON object describing how to launch the server

[screenshot: "Add MCP server" dialog with Name and Parameters fields]

### Parameters format

The Parameters field expects a JSON object with this shape:

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
  }
}
```

| Field | Required | Notes |
| :--- | :--- | :--- |
| `command` | Yes | The executable to run. Usually `npx` or `node`. |
| `args` | No | Array of arguments passed to the command. |
| `env` | No | Key/value pairs injected into the server's environment. |

> **Important:** paste only this inner object into the Parameters field — do not wrap it in a `mcpServers` key or any other outer structure.

4. Click **Save**. Neural Composer launches the server as a subprocess and connects to it via stdio.

---

## Example: GitHub MCP server

**Prerequisites:** Node.js installed; a GitHub personal access token with `repo` scope.

Parameters:

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
  }
}
```

Once connected, you can ask questions in the chat like:
- *"What are the open issues in my repo?"*
- *"Summarize the last 5 commits."*

The model will call the GitHub MCP tools automatically and combine the results with your vault graph.

[screenshot: chat pane — a question about a GitHub repo, with a visible tool call to the GitHub MCP server and a combined answer]

---

## Example: Filesystem MCP server

Allows the model to read files outside your Obsidian vault.

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
}
```

Replace `/Users/you/Documents` with the directory you want to expose.

---

## Enabling and disabling tools per server

In the Tools (MCP) tab, each server has a toggle. When disabled, its tools are hidden from the model and will not be called.

You can also configure individual tools per server — for example, to disable a destructive tool (like file deletion) while keeping read-only tools active.

[screenshot: Tools (MCP) tab showing a server entry expanded with individual tool toggles visible]

---

## MCP is desktop-only

MCP functionality is not available on mobile. The Tools (MCP) tab is hidden when Obsidian is running on iOS or Android.

---

## Troubleshooting

### "No tools available" after adding a server

- Confirm Node.js is installed and accessible (`node --version` in a terminal).
- Try running the command manually in a terminal to see if it produces errors (e.g., `npx -y @modelcontextprotocol/server-github`).
- Check that the API key or token in `env` is valid.

### The server connects but no tool calls happen in chat

- Confirm **Enable tools** is toggled on in the Chat settings tab.
- Check that **Max auto-iterations** is at least `1` (Settings → Chat).

### "Invalid JSON format" error in the Add MCP server dialog

Paste only the inner object into the Parameters field. The correct format is:

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
}
```

Not this:

```json
{
  "mcpServers": {
    "my-server": { ... }
  }
}
```

The `mcpServers` wrapper is Claude Desktop's config format — it is not used here.
