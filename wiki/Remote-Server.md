# Remote Server

Neural Composer can connect to a LightRAG instance running on a different machine — a home NAS, a VPS, or a Docker container. This is useful when you want to:

- Offload ingestion and graph storage to a more powerful machine.
- Share a single graph across multiple computers or users.
- Keep Obsidian's resource usage low on a laptop by running the heavy Python process elsewhere.

---

## How remote mode works

In remote mode, the plugin sends all queries and ingestion requests to the configured URL instead of spawning a local Python process. The local machine needs no Python or LightRAG installation. The remote machine runs `lightrag-server` as usual.

[screenshot: "Use remote server" toggle enabled in Graph & Vault settings, with the URL field showing a LAN IP address]

---

## Option A — Docker (recommended)

The easiest way to run LightRAG remotely is with Docker.

### docker-compose.yml

```yaml
version: "3.9"
services:
  lightrag:
    image: ghcr.io/hkuds/lightrag:latest
    ports:
      - "9621:9621"
    volumes:
      - ./lightrag-data:/app/data
      - ./lightrag.env:/app/.env
    restart: unless-stopped
```

Create a `lightrag.env` file next to the compose file with your provider config:

```env
LLM_BINDING=openai
LLM_MODEL=gpt-4o-mini
LLM_BINDING_HOST=https://api.openai.com
LLM_API_KEY=sk-...

EMBEDDING_BINDING=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BINDING_HOST=https://api.openai.com
EMBEDDING_API_KEY=sk-...
```

Start it:

```bash
docker compose up -d
```

The server is now reachable at `http://<host-ip>:9621`.

[screenshot: terminal showing `docker compose up -d` completing successfully, container running]

---

## Option B — NAS (Synology / TrueNAS / QNAP)

Most modern NAS devices support Docker or Portainer. Use the same `docker-compose.yml` above via the NAS container manager UI.

**Synology DSM:**
1. Install **Container Manager** from Package Center.
2. Create a project from the `docker-compose.yml`.
3. Set up a persistent folder in `/volume1/docker/lightrag-data` as the data volume.

[screenshot: Synology Container Manager showing the lightrag container running with ports and status]

**Port forwarding:** If you want to reach the NAS from outside your LAN, forward port `9621` in your router to the NAS IP. Pair this with a firewall rule to allow only trusted IPs, or put a reverse proxy (nginx, Caddy) with HTTPS and auth in front of it.

---

## Option C — VPS (any Linux server)

```bash
# On the VPS
python -m venv ~/.venvs/lightrag
source ~/.venvs/lightrag/bin/activate
pip install "lightrag-hku[api]"

# Create a .env file at ~/lightrag-data/.env with your provider config
mkdir -p ~/lightrag-data

# Start the server (bind to all interfaces so it's reachable remotely)
lightrag-server --host 0.0.0.0 --port 9621 --working-dir ~/lightrag-data
```

To keep it running after logout, use a systemd unit or `tmux`/`screen`.

### systemd unit (recommended)

Create `/etc/systemd/system/lightrag.service`:

```ini
[Unit]
Description=LightRAG API Server
After=network.target

[Service]
User=youruser
WorkingDirectory=/home/youruser/lightrag-data
ExecStart=/home/youruser/.venvs/lightrag/bin/lightrag-server \
    --host 0.0.0.0 \
    --port 9621 \
    --working-dir /home/youruser/lightrag-data
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now lightrag
```

---

## Step — Connect Neural Composer to the remote server

1. Open **Settings → Neural Composer → Graph & Vault**.
2. Toggle **Use remote server** on.
3. Enter the server URL: `http://<ip-or-hostname>:9621`
4. If you configured an API key on the server side (via `LIGHTRAG_API_KEY` in `.env`), enter it in the **API key** field.
5. Click **Restart Server** (this just reconnects — no local process is started).

The status bar dot will turn green when the plugin successfully reaches the remote server.

[screenshot: remote server fields filled in — URL showing a LAN address, API key field, green status dot in the bottom bar]

---

## Security recommendations

| Recommendation | Why |
| :--- | :--- |
| Set `LIGHTRAG_API_KEY` in the server `.env` | Prevents unauthorized access to your graph |
| Use a reverse proxy with HTTPS (nginx + Let's Encrypt / Caddy) | Encrypts traffic, especially important over the internet |
| Restrict port `9621` in the firewall to known IPs | Reduces attack surface even with an API key |
| Do not expose `9621` directly to the internet without auth | LightRAG's built-in API key check is minimal — defense in depth matters |

### Nginx reverse proxy example

```nginx
server {
    listen 443 ssl;
    server_name lightrag.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/lightrag.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lightrag.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9621;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then set the Neural Composer URL to `https://lightrag.yourdomain.com`.

---

## Syncing notes to the remote machine

The remote LightRAG server only needs to receive ingestion requests via HTTP — it does not need direct access to your vault files. Neural Composer reads each file locally and sends its content to the server's `/documents/text` endpoint.

This means your notes never need to be copied to the remote machine. Only the extracted graph data (entities, relationships, embeddings) is stored there.
