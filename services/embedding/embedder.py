import os
import io
import tarfile
import threading
import urllib.request
from typing import List
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

DEFAULT_MODEL_DIR = os.path.expanduser("~/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx")
MODEL_TAR_URL = "https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz"

class MiniLMEmbedder:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, model_dir: str = None):
        self.model_dir = model_dir or os.getenv("EMBEDDING_MODEL_DIR", DEFAULT_MODEL_DIR)
        model_path = os.path.join(self.model_dir, "model.onnx")
        tok_path = os.path.join(self.model_dir, "tokenizer.json")

        if not os.path.exists(model_path) or not os.path.exists(tok_path):
            self._download_model()

        if not os.path.exists(model_path) or not os.path.exists(tok_path):
            raise FileNotFoundError(f"Model or tokenizer not found in {self.model_dir}")

        # Optimize ONNX Runtime options for bounded CPU & memory footprint
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2
        opts.inter_op_num_threads = 1
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        self.session = ort.InferenceSession(model_path, sess_options=opts)
        self.tokenizer = Tokenizer.from_file(tok_path)
        self.tokenizer.enable_truncation(max_length=256)
        self.inference_lock = threading.Lock()

    def _download_model(self):
        parent_dir = os.path.dirname(self.model_dir)
        os.makedirs(parent_dir, exist_ok=True)
        try:
            req = urllib.request.Request(MODEL_TAR_URL, headers={"User-Agent": "Sourcebook/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                with tarfile.open(fileobj=io.BytesIO(resp.read()), mode="r:gz") as tar:
                    tar.extractall(parent_dir)
        except Exception as e:
            # Re-raise or log download issue
            pass

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        BATCH_SIZE = 16
        all_embeddings = []

        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i:i + BATCH_SIZE]
            self.tokenizer.enable_padding(direction="right", pad_id=0, pad_token="[PAD]")
            encodings = self.tokenizer.encode_batch(batch)

            input_ids = np.array([e.ids for e in encodings], dtype=np.int64)
            attention_mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)
            token_type_ids = np.array([e.type_ids for e in encodings], dtype=np.int64)

            with self.inference_lock:
                outputs = self.session.run(None, {
                    "input_ids": input_ids,
                    "attention_mask": attention_mask,
                    "token_type_ids": token_type_ids
                })

            # Mean pooling: sum embeddings masked by attention_mask, divide by count
            token_embeddings = outputs[0]  # shape: (batch_size, seq_len, 384)
            mask_expanded = np.expand_dims(attention_mask, -1)
            sum_embeddings = np.sum(token_embeddings * mask_expanded, axis=1)
            sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
            mean_pooled = sum_embeddings / sum_mask

            # Normalize (L2 norm)
            norms = np.linalg.norm(mean_pooled, axis=1, keepdims=True)
            norms = np.clip(norms, a_min=1e-9, a_max=None)
            normalized = mean_pooled / norms
            all_embeddings.extend(normalized.astype(float).tolist())

        return all_embeddings
