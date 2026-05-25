# MCP Tools

Neural Composer can expose your vault's knowledge graph to any client that supports the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP). This lets external AI agents — Claude Desktop, Cursor, VS Code with Copilot, or custom scripts — query and reason over your graph without opening Obsidian.

---

## How it works

Neural Composer acts as an **MCP server**. It exposes tools that an MCP-compatible client can call:

| Tool | What it does |
| :--- | :--- |
| `query_graph` | Sends a question to LightRAG and returns the answer with citations. |
| `list_documents` | Returns the list of ingested documents and their statuses. |
| `get_entity` | Retrieves metadata and relationships for a named entity. |

The client connects to Neural Composer, discovers these tools, and can invoke them as part of a conversation or automated workflow.

---

## Step 1 — Enable the MCP server in Neural Composer

1. Open **Settings → Neural Composer → Tools (MCP)**.
2. Click **Add MCP server**.
3. Fill in the form:
   - **Name:** anything you like (e.g., `Vault Graph`)
   - **Transport:** `stdio` for local clients (Claude Desktop, Cursor); `sse` for network clients
   - **Command:** the path to the Neural Composer MCP bridge (see below)
4. Click **Save**.

[screenshot: filled-in "Add MCP server" form with Name "Vault Graph", Transport "stdio", and a command path]

---

## Step 2 — Connect Claude Desktop

Claude Desktop reads MCP server definitions from its config file.

### Locate the config file

| Platform | Path |
| :--- | :--- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### Add the Neural Composer entry

Open the file in any text editor and add an entry under `mcpServers`:

```json
{
  "mcpServers": {
    "neural-composer": {
      "command": "/path/to/neural-composer-mcp-bridge",
      "args": [],
      "env": {
        "LIGHTRAG_URL": "http://localhost:9621"
      }
    }
  }
}
```

Replace `/path/to/neural-composer-mcp-bridge` with the command path shown in Neural Composer's settings.

[screenshot: claude_desktop_config.json open in a text editor with the neural-composer entry visible]

### Restart Claude Desktop

Quit and relaunch Claude Desktop. The Neural Composer tools will appear in the tool picker when you start a new conversation.

[screenshot: Claude Desktop tool picker showing "neural-composer" as an available MCP server with its tools listed]

---

## Step 3 — Test the connection

In Claude Desktop (or your MCP client), start a conversation and ask:

> "What topics are covered in my knowledge graph?"

Claude should call `query_graph` and return an answer sourced from your vault.

[screenshot: Claude Desktop conversation — user asks a question, Claude shows a tool call to query_graph, then the answer with citations]

---

## SSE transport (network clients)

If you want to expose your graph to a remote client or a browser-based tool, use **SSE** transport instead of `stdio`.

1. In the Tools (MCP) tab, set Transport to `sse`.
2. Neural Composer will expose an SSE endpoint at `http://localhost:<port>/sse`.
3. Point your MCP client at that URL.

> **Security note:** SSE transport has no built-in authentication. Do not expose the SSE endpoint to the public internet without a reverse proxy and auth layer in front of it.

---

## Using MCP tools in the chat pane

When **Enable tools** is on in the Chat tab, the chat pane itself can call MCP tools registered in the Tools (MCP) tab. This means you can add external MCP servers (e.g., a web search tool or a calendar) and the chat model will use them alongside your vault graph.

[screenshot: chat pane with a tool call visible inline — the model invoked a registered MCP tool and shows the result before its final answer]

---

## Troubleshooting MCP

### "No tools available" in Claude Desktop

- Confirm the command path in `claude_desktop_config.json` is correct and the binary is executable.
- Check that Neural Composer (and the LightRAG server) is running in Obsidian before opening Claude Desktop.
- Try running the command manually in a terminal to see if it outputs errors.

### Tool calls return empty results

- The LightRAG server may be offline. Check the status bar dot in Obsidian.
- Confirm `LIGHTRAG_URL` in the config matches the URL Neural Composer is listening on (default: `http://localhost:9621`).

### SSE client can't connect

- Check that the port is not blocked by a firewall.
- Verify the SSE endpoint URL in the client matches the one shown in the Neural Composer Tools (MCP) tab.
