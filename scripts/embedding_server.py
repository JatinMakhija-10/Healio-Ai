#!/usr/bin/env python3
"""
Arovia.ai — High-Speed Local ONNX Embedding Microservice
=========================================================
Runs on localhost:5005 to serve ultra-fast (15ms) 768-dim embeddings
using BAAI/bge-base-en-v1.5 for the Next.js web application.
"""

import json, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from fastembed import TextEmbedding

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("⚡ Loading FastEmbed BAAI/bge-base-en-v1.5 model for Arovia Web App...", flush=True)
embedder = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")
print("✅ Local FastEmbed Ready on http://127.0.0.1:5005/embed", flush=True)

class EmbedHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/embed" or self.path == "/":
            try:
                length = int(self.headers.get('content-length', 0))
                body = json.loads(self.rfile.read(length))
                text = body.get('text', '')
                vec = list(embedder.embed([text]))[0].tolist()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'embedding': vec}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass  # keep output clean

if __name__ == "__main__":
    server = HTTPServer(('127.0.0.1', 5005), EmbedHandler)
    server.serve_forever()
