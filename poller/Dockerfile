FROM python:3.12-slim

WORKDIR /app

# Install supercronic for reliable cron scheduling
ARG TARGETARCH
# Checksums from https://github.com/aptible/supercronic/releases/tag/v0.2.33
ARG SUPERCRONIC_SHA_amd64="feefa310da569c81b99e1027b86b27b51e6ee9ab647747b49099645120cfc671"
ARG SUPERCRONIC_SHA_arm64="f1f8585c66de020fef494dd636058f99949d108f569fef00016a1c8b9eb145b3"
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    SUPERCRONIC_URL="https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-${TARGETARCH}" && \
    curl -fsSL "${SUPERCRONIC_URL}" -o /usr/local/bin/supercronic && \
    EXPECTED_SHA=$(eval echo "\$SUPERCRONIC_SHA_${TARGETARCH}") && \
    echo "${EXPECTED_SHA}  /usr/local/bin/supercronic" | sha256sum -c - && \
    chmod +x /usr/local/bin/supercronic && \
    apt-get purge -y curl && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --system --uid 1001 poller
USER poller

CMD ["supercronic", "crontab"]
