# Providers Guide

This page covers provider-specific setup, recommended models, and known quirks for each AI provider supported by Neural Composer.

Each provider needs two things: a configuration entry in **Settings → Providers**, and a model selection in **Settings → Models** (for the chat model) and/or **Settings → Graph & Vault** (for the graph logic model and embedding model).

---

## OpenAI

**Get an API key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `gpt-4o` | Best quality; good for complex reasoning questions |
| Chat (fast) | `gpt-4o-mini` | Much cheaper; good for simple questions |
| Graph logic | `gpt-4o-mini` | Cost-efficient for entity extraction during ingestion |
| Embedding | `text-embedding-3-small` | Good balance of quality and cost |
| Embedding (best) | `text-embedding-3-large` | Better recall on large, diverse vaults |

### Notes

- The **Apply model** slot (used for note edits) works well with `gpt-4o-mini`.
- OpenAI rate limits apply to both chat and embedding calls. If ingestion fails with `429 Too Many Requests`, reduce **Async workers** in Advanced settings.

[screenshot: Providers tab with an OpenAI row showing a masked API key]

---

## Anthropic

**Get an API key:** [console.anthropic.com](https://console.anthropic.com)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `claude-sonnet-4-5` | Strong reasoning, long context window |
| Chat (fast) | `claude-haiku-4-5` | Fastest Claude model; good for quick queries |
| Graph logic | `claude-haiku-4-5` | Fast and cheap for extraction tasks |

> **Note:** Anthropic does not offer an embedding model. For embeddings with Anthropic as your chat provider, use OpenAI's `text-embedding-3-small` or Ollama's `nomic-embed-text` as a separate embedding provider.

---

## Gemini (Google)

**Get an API key:** [aistudio.google.com](https://aistudio.google.com)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `gemini-1.5-pro` | Strong on long-context retrieval |
| Chat (fast) | `gemini-1.5-flash` | Very cost-efficient |
| Graph logic | `gemini-1.5-flash` | Excellent cost-to-quality for extraction |
| Embedding | `text-embedding-004` | Google's latest embedding model |

### Notes

- Gemini Flash is one of the most cost-efficient options for the **graph logic model** — it's called for every chunk during ingestion, so cost adds up quickly on large vaults.
- The Gemini free tier is generous for testing, but has strict rate limits. Switch to a paid key for production ingestion.

---

## Groq

**Get an API key:** [console.groq.com](https://console.groq.com)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `llama-3.3-70b-versatile` | Fast inference, strong general quality |
| Chat (fast) | `llama-3.1-8b-instant` | Extremely fast; good for simple queries |
| Graph logic | `llama-3.1-8b-instant` | Very cheap; fast ingestion |

### Notes

- Groq does not offer an embedding model. Pair it with OpenAI or Ollama embeddings.
- Groq's rate limits on the free tier are low (tokens per minute). For large vault ingestion, use a paid plan or reduce **Async workers**.

---

## OpenRouter

**Get an API key:** [openrouter.ai/keys](https://openrouter.ai/keys)

OpenRouter is a unified API gateway to dozens of providers. Useful when you want to mix models or access models not directly supported.

### Setup

- Provider: `OpenRouter`
- API key: your OpenRouter key
- Model ID: the full OpenRouter model identifier, e.g., `anthropic/claude-3.5-sonnet`, `google/gemini-flash-1.5`, `meta-llama/llama-3.3-70b-instruct`

### Notes

- Model IDs on OpenRouter use the format `provider/model-name`. Check [openrouter.ai/models](https://openrouter.ai/models) for the exact string.
- Billing goes through your OpenRouter account and is charged per-token by the underlying provider's rate.

---

## Deepseek

**Get an API key:** [platform.deepseek.com](https://platform.deepseek.com)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `deepseek-chat` | Strong reasoning; very competitive cost |
| Chat (reasoning) | `deepseek-reasoner` | Chain-of-thought model for complex questions |
| Graph logic | `deepseek-chat` | Affordable for extraction tasks |

### Notes

- Deepseek does not offer an embedding model. Use OpenAI or Ollama embeddings.
- The Deepseek API is compatible with the OpenAI SDK format, so it works reliably with Neural Composer's OpenAI-compatible path.

---

## Ollama (fully local)

**Install Ollama:** [ollama.com](https://ollama.com)

Ollama runs open-weight models entirely on your local machine. No API key, no data leaving your machine.

### Setup

1. Install Ollama and start the service (`ollama serve`).
2. Pull the models you want:
   ```bash
   ollama pull llama3.2          # chat model
   ollama pull nomic-embed-text   # embedding model
   ```
3. In Providers, set host to `http://localhost:11434` (default). No API key needed.
4. In Models, select your pulled models.

[screenshot: Providers tab showing Ollama row with host URL and no API key]

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `llama3.2` / `mistral` | Good general-purpose; fits on 8 GB VRAM |
| Chat (large) | `llama3.1:70b` | Much better quality; needs 40+ GB RAM |
| Graph logic | `llama3.2` | Fast and free; extraction quality is adequate |
| Embedding | `nomic-embed-text` | Best local embedding model; 768-dimensional |

### Notes

- The first request after Ollama starts takes 10–60 seconds while the model loads. Subsequent requests are fast.
- Ingestion is significantly slower with local models vs. cloud APIs, especially on CPU-only machines.
- If Ollama is running on a different machine than Obsidian, set the host to that machine's IP (e.g., `http://192.168.1.50:11434`) and ensure the port is accessible.

---

## LM Studio

**Install LM Studio:** [lmstudio.ai](https://lmstudio.ai)

LM Studio provides a GUI for managing local models and exposes an OpenAI-compatible API.

### Setup

1. Download and load a model in LM Studio.
2. Start the local server (default port: `1234`).
3. In Providers, set host to `http://localhost:1234`. No API key needed.
4. In Models, type the model name exactly as shown in LM Studio's server log.

### Notes

- LM Studio's API is OpenAI-compatible, so any model ID that works in LM Studio's UI should work here.
- LM Studio does not expose an embedding endpoint by default. Use Ollama or OpenAI for embeddings.

---

## Morph

Morph is a code-specialized model designed for the **Apply** step — when Neural Composer edits a note in response to a chat suggestion.

**Get an API key:** [morph.so](https://morph.so)

Set Morph as the **Apply model** in Settings → Models. Keep your primary chat model unchanged.

---

## Perplexity

**Get an API key:** [perplexity.ai/settings/api](https://perplexity.ai/settings/api)

Perplexity's models include web search augmentation. Useful as a **chat model** when you want answers that combine your vault with up-to-date web information.

> **Note:** Perplexity's search-augmented models are not well-suited as the **graph logic model** — use a standard LLM (OpenAI, Gemini) for entity extraction.

---

## Mistral

**Get an API key:** [console.mistral.ai](https://console.mistral.ai)

### Recommended models

| Use | Model | Notes |
| :--- | :--- | :--- |
| Chat | `mistral-large-latest` | Strong reasoning |
| Chat (fast) | `mistral-small-latest` | Fast and affordable |
| Embedding | `mistral-embed` | Mistral's dedicated embedding model |
| Graph logic | `mistral-small-latest` | Cost-efficient for extraction |
