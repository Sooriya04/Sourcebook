import sys
import json
import os

# Add parent directory to sys.path so we can import services.embedding.embedder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from services.embedding.embedder import MiniLMEmbedder

def main():
    texts = []
    if len(sys.argv) > 1:
        # Received texts as CLI arguments
        texts = sys.argv[1:]
    else:
        # Read from stdin
        try:
            raw = sys.stdin.read().strip()
            if raw:
                data = json.loads(raw)
                if isinstance(data, list):
                    texts = data
                elif isinstance(data, dict):
                    texts = data.get("texts", [data.get("text", "")])
        except Exception as e:
            print(json.dumps({"error": f"Failed to parse input: {e}"}))
            sys.exit(1)

    if not texts:
        print(json.dumps({"error": "No texts provided"}))
        sys.exit(1)

    try:
        embedder = MiniLMEmbedder.get_instance()
        embs = embedder.embed_batch(texts)
        result = {
            "embeddings": embs,
            "dimension": len(embs[0]) if embs else 384,
            "count": len(embs)
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
