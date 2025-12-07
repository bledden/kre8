#!/usr/bin/env python3
"""
Generate embeddings for sound catalog using BGE-M3.

This script:
1. Loads the sound catalog JSON
2. Generates 1024-dimensional embeddings using BGE-M3
3. Outputs a JSON file with sounds + embeddings ready for arrwDB

BGE-M3 is used because:
- 1024 dimensions (matches arrwDB's default)
- State-of-the-art retrieval accuracy (72% on MTEB)
- MIT licensed for commercial use
- Supports up to 8192 tokens
"""

import json
import time
from pathlib import Path
from typing import Optional

import numpy as np
from tqdm import tqdm


def load_bge_m3():
    """Load BGE-M3 model."""
    print("Loading BGE-M3 model (this may take a moment on first run)...")
    print("Model size: ~2.3GB - downloading if not cached...")

    try:
        # Try FlagEmbedding first (official BAAI implementation)
        from FlagEmbedding import BGEM3FlagModel

        model = BGEM3FlagModel(
            "BAAI/bge-m3",
            use_fp16=True,  # Use half precision for faster inference
        )
        print("Loaded BGE-M3 via FlagEmbedding")
        return model, "flagembedding"

    except ImportError:
        print("FlagEmbedding not found, trying sentence-transformers...")

        # Fallback to sentence-transformers
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("BAAI/bge-m3")
        print("Loaded BGE-M3 via sentence-transformers")
        return model, "sentence-transformers"


def generate_embeddings_flagembedding(model, texts: list[str]) -> list[list[float]]:
    """Generate embeddings using FlagEmbedding."""
    # BGE-M3 returns dict with 'dense_vecs' for dense embeddings
    result = model.encode(
        texts,
        batch_size=32,
        max_length=512,  # More than enough for our short descriptions
        return_dense=True,
        return_sparse=False,
        return_colbert_vecs=False,
    )

    # Extract dense vectors
    embeddings = result["dense_vecs"]

    # Convert to list of lists for JSON serialization
    return [emb.tolist() for emb in embeddings]


def generate_embeddings_sentence_transformers(model, texts: list[str]) -> list[list[float]]:
    """Generate embeddings using sentence-transformers."""
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    return [emb.tolist() for emb in embeddings]


# Cache for model (lazy loading)
_model_cache = {"model": None, "backend": None}


def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text query.
    Used by load_to_arrwdb.py for testing searches.
    """
    if _model_cache["model"] is None:
        _model_cache["model"], _model_cache["backend"] = load_bge_m3()

    model = _model_cache["model"]
    backend = _model_cache["backend"]

    if backend == "flagembedding":
        embeddings = generate_embeddings_flagembedding(model, [text])
    else:
        embeddings = generate_embeddings_sentence_transformers(model, [text])

    return embeddings[0]


def build_search_text(sound: dict) -> str:
    """
    Build the text to embed for semantic search.

    Combines name, description, and tags for rich semantic matching.
    """
    parts = [
        sound["name"],
        sound["description"],
        f"Category: {sound['category']}",
        f"Source: {sound['source']}",
        f"Tags: {', '.join(sound['tags'])}",
    ]
    return " | ".join(parts)


def main(
    catalog_path: Optional[str] = None,
    output_path: Optional[str] = None,
):
    """Generate embeddings for the sound catalog."""

    # Default paths
    script_dir = Path(__file__).parent
    if catalog_path is None:
        catalog_path = script_dir / "sound_catalog.json"
    else:
        catalog_path = Path(catalog_path)

    if output_path is None:
        output_path = script_dir / "sound_catalog_with_embeddings.json"
    else:
        output_path = Path(output_path)

    # Load catalog
    print(f"Loading catalog from: {catalog_path}")
    with open(catalog_path) as f:
        sounds = json.load(f)
    print(f"Loaded {len(sounds)} sounds")

    # Load model
    model, backend = load_bge_m3()

    # Build texts for embedding
    print("\nPreparing texts for embedding...")
    texts = [build_search_text(sound) for sound in sounds]

    # Show sample
    print(f"\nSample search text:\n{texts[0][:200]}...")

    # Generate embeddings
    print(f"\nGenerating embeddings with BGE-M3 ({backend})...")
    start_time = time.time()

    if backend == "flagembedding":
        embeddings = generate_embeddings_flagembedding(model, texts)
    else:
        embeddings = generate_embeddings_sentence_transformers(model, texts)

    elapsed = time.time() - start_time
    print(f"Generated {len(embeddings)} embeddings in {elapsed:.2f}s")
    print(f"Embedding dimension: {len(embeddings[0])}")

    # Add embeddings to sounds
    print("\nAdding embeddings to catalog...")
    for i, sound in enumerate(sounds):
        sound["embedding"] = embeddings[i]
        sound["search_text"] = texts[i]

    # Save output
    print(f"\nSaving to: {output_path}")
    with open(output_path, "w") as f:
        json.dump(sounds, f)

    # Calculate file size
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Output file size: {file_size_mb:.2f} MB")

    # Summary
    print("\n" + "=" * 50)
    print("EMBEDDING GENERATION COMPLETE")
    print("=" * 50)
    print(f"Sounds: {len(sounds)}")
    print(f"Embedding dim: {len(embeddings[0])}")
    print(f"Time: {elapsed:.2f}s")
    print(f"Output: {output_path}")
    print("\nNext step: Run load_to_arrwdb.py to upload to arrwDB")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate embeddings for sound catalog")
    parser.add_argument("--catalog", type=str, help="Path to sound catalog JSON")
    parser.add_argument("--output", type=str, help="Path for output JSON with embeddings")

    args = parser.parse_args()
    main(catalog_path=args.catalog, output_path=args.output)
