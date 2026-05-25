# Reranking

Reranking is an optional second-pass scoring step that runs after the initial graph retrieval and before the LLM generates a response. A dedicated reranker model scores each retrieved chunk against your query and reorders them by relevance, so the LLM sees the best material first.

---

## When to use reranking

Reranking is most valuable when:

- Your graph has a large number of nodes (roughly 1 000+) and answers sometimes feel off-topic or miss the point.
- You are using **mix** mode (all retrieval strategies combined) and want to filter down the top results.
- You want a fully local, privacy-preserving pipeline and have a machine capable of running a local reranker.

For small graphs or when response quality is already satisfactory, reranking adds latency and cost without much benefit.

---

## Enabling reranking

Open **Settings → Neural Composer → Graph & Vault → Reranking** and select a provider from the dropdown.

[screenshot: Reranking section — provider dropdown open showing options: None, Jina AI, Cohere, Custom]

---

## Jina AI

**Get an API key:** [jina.ai](https://jina.ai) — free tier available.

| Field | Value |
| :--- | :--- |
| **Provider** | Jina AI |
| **Model** | `jina-reranker-v2-base-multilingual` (default) |
| **API key** | Your Jina API key |

[screenshot: Reranking section configured for Jina AI with model and API key filled in]

### Available models

| Model | Notes |
| :--- | :--- |
| `jina-reranker-v2-base-multilingual` | Best for multilingual vaults; strong general-purpose |
| `jina-reranker-v1-base-en` | English-only; slightly faster |
| `jina-colbert-v2` | Higher quality on long documents; slower |

### Notes

- Jina offers a free tier (1M tokens/month as of 2026). This is usually sufficient for reranking on a personal vault.
- Jina reranking adds ~200–500 ms per query depending on network latency and result count.

---

## Cohere

**Get an API key:** [dashboard.cohere.com](https://dashboard.cohere.com) — free trial available.

| Field | Value |
| :--- | :--- |
| **Provider** | Cohere |
| **Model** | `rerank-english-v3.0` (default) |
| **API key** | Your Cohere API key |

[screenshot: Reranking section configured for Cohere]

### Available models

| Model | Notes |
| :--- | :--- |
| `rerank-english-v3.0` | Best quality for English-language notes |
| `rerank-multilingual-v3.0` | Use if your vault is in multiple languages |
| `rerank-english-v2.0` | Older model; cheaper but lower quality |

---

## Custom local endpoint

Use this to connect any HTTP-based reranking service — for example, a FastAPI server wrapping a HuggingFace `cross-encoder` model running on your own machine.

| Field | Value |
| :--- | :--- |
| **Provider** | Custom |
| **Host** | Base URL of your reranking server, e.g., `http://localhost:8080` |
| **Model** | The model name to pass in the request body (if your server supports multiple models) |
| **API key** | Optional. Sent as `Authorization: Bearer <key>` if provided. |

[screenshot: Reranking section with Custom selected and a localhost URL in the Host field]

### Expected API contract

Neural Composer sends reranking requests in this format:

```
POST <host>/rerank
Content-Type: application/json

{
  "model": "<model>",
  "query": "your question",
  "documents": ["chunk text 1", "chunk text 2", ...]
}
```

Expected response:

```json
{
  "results": [
    { "index": 2, "relevance_score": 0.94 },
    { "index": 0, "relevance_score": 0.87 },
    { "index": 1, "relevance_score": 0.41 }
  ]
}
```

Results must be sorted by descending `relevance_score`. The `index` field refers to the position in the input `documents` array.

### Example: local cross-encoder with FastAPI

```python
from fastapi import FastAPI
from sentence_transformers import CrossEncoder

app = FastAPI()
model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

@app.post("/rerank")
def rerank(body: dict):
    query = body["query"]
    docs = body["documents"]
    pairs = [[query, doc] for doc in docs]
    scores = model.predict(pairs)
    results = sorted(
        [{"index": i, "relevance_score": float(s)} for i, s in enumerate(scores)],
        key=lambda x: x["relevance_score"],
        reverse=True,
    )
    return {"results": results}
```

Run with: `uvicorn main:app --port 8080`

Set **Host** to `http://localhost:8080` in Neural Composer.

---

## Performance impact

| Provider | Typical added latency | Cost |
| :--- | :--- | :--- |
| Jina AI | 200–500 ms | Low (free tier covers personal use) |
| Cohere | 200–600 ms | Low (free trial; then pay-per-call) |
| Local cross-encoder (CPU) | 300–2000 ms | Zero |
| Local cross-encoder (GPU) | 50–200 ms | Zero |

Reranking latency is added to every query. For latency-sensitive setups, use a local GPU-accelerated reranker or disable reranking and rely on the graph's native retrieval quality.
