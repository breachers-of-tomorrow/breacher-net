FROM python:3.12-slim

WORKDIR /app

# Install supercronic for reliable cron scheduling
ARG TARGETARCH
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    SUPERCRONIC_URL="https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-${TARGETARCH}" && \
    curl -fsSL "${SUPERCRONIC_URL}" -o /usr/local/bin/supercronic && \
    chmod +x /usr/local/bin/supercronic && \
    apt-get purge -y curl && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --system --uid 1001 poller
USER poller

CMD ["supercronic", "crontab"]
