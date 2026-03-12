from __future__ import annotations
from typing import List
from fastembed import TextEmbedding

embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")


def embed(text: str) -> List[float]:
    """Return embedding vector for a single text string."""
    embeddings = list(embedding_model.embed([text]))
    return embeddings[0].tolist()
