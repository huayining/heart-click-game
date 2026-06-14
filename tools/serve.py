from __future__ import annotations

import http.server
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PORT = 8082


class GameHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".gif": "image/gif",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main() -> None:
    with http.server.ThreadingHTTPServer(("", PORT), GameHandler) as httpd:
        print(f"Serving Heart Pop at http://localhost:{PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
