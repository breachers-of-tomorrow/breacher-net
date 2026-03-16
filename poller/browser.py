"""Shared HTTP client for accessing cryoarchive.systems past Vercel Security Checkpoint.

Vercel's WAF blocks plain HTTP clients (curl, Python requests) based on TLS
fingerprinting.  This module uses ``curl_cffi`` — a Python binding for
curl-impersonate (https://github.com/lwthiker/curl-impersonate) — which
presents a genuine Chrome TLS fingerprint and bypasses the checkpoint without
needing a full headless browser.

Usage::

    from browser import CryoBrowser

    with CryoBrowser() as cryo:
        state = cryo.fetch_json("/api/public/state")
        html, headers = cryo.fetch_page("/")

See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49
"""

import logging
import os
from pathlib import Path

from curl_cffi import CurlMime, requests as cffi_requests

log = logging.getLogger(__name__)

BASE_URL = os.environ.get("CRYO_BASE_URL", "https://cryoarchive.systems")
REQUEST_TIMEOUT = int(os.environ.get("CRYO_REQUEST_TIMEOUT", "30"))
IMPERSONATE = os.environ.get("CRYO_IMPERSONATE", "chrome")


class CryoBrowser:
    """Context-managed HTTP session that impersonates Chrome's TLS fingerprint.

    Replaces the previous Playwright-based approach.  ``curl_cffi`` handles
    TLS fingerprint impersonation at the libcurl level, which is enough to
    satisfy Vercel's bot-detection (it checks JA3/JA4 fingerprints, not JS
    execution).  This is dramatically lighter than running headless Chromium.
    """

    def __init__(self):
        self._session: cffi_requests.Session | None = None

    # ── lifecycle ────────────────────────────────────────────────────────

    def __enter__(self):
        self._start()
        return self

    def __exit__(self, *exc):
        self._close()

    def _start(self):
        log.info("Creating curl_cffi session (impersonate=%s)", IMPERSONATE)
        self._session = cffi_requests.Session(impersonate=IMPERSONATE)

    def _close(self):
        if self._session:
            try:
                self._session.close()
            except Exception:
                pass

    # ── public request helpers ───────────────────────────────────────────

    def fetch_json(self, path: str) -> dict:
        """``GET`` a JSON API endpoint and return the parsed response."""
        url = self._abs(path)
        resp = self._session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def fetch_page(self, path: str) -> tuple[str, dict]:
        """``GET`` a page and return ``(html, response_headers)``."""
        url = self._abs(path)
        resp = self._session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        headers = {k.lower(): v for k, v in resp.headers.items()}
        return resp.text, headers

    def post_json(self, path: str, body: dict | None = None) -> dict:
        """``POST`` JSON and return the parsed response."""
        url = self._abs(path)
        resp = self._session.post(url, json=body, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def post_file(
        self,
        path: str,
        field: str,
        file_path: str,
        filename: str,
        content_type: str,
    ) -> dict:
        """``POST`` a single file as ``multipart/form-data``.

        Uses ``CurlMime`` (curl_cffi >=0.14) instead of the removed ``files=`` parameter.
        """
        url = self._abs(path)
        mp = CurlMime()
        mp.addpart(
            name=field,
            filename=filename,
            content_type=content_type,
            local_path=file_path,
        )
        resp = self._session.post(
            url,
            multipart=mp,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    # ── internal ─────────────────────────────────────────────────────────

    def _abs(self, path: str) -> str:
        return f"{BASE_URL}{path}" if path.startswith("/") else path
