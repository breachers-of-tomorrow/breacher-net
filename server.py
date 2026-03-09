import http.server
import socketserver
import os

# Serve files from the same folder as this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress console spam

print("=" * 40)
print("  CRYOARCHIVE DASHBOARD SERVER")
print("=" * 40)
print(f"  Open in browser: http://localhost:{PORT}")
print("  Keep this window open while monitoring.")
print("  Press Ctrl+C to stop.")
print("=" * 40)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
