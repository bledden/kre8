# Kre8 Sound Catalog for arrwDB

Semantic search for Strudel sounds using BGE-M3 embeddings and arrwDB.

## Overview

This system enables natural language search for sounds:
- "warm electric piano for jazz" → `gm_epiano1`
- "heavy bass for dubstep" → `jungbass`, `gm_synth_bass_1`
- "japanese traditional instrument" → `gm_koto`, `gm_shamisen`

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐
│  Sound Catalog  │ ──▶ │   BGE-M3    │ ──▶ │   arrwDB    │
│   (JSON)        │     │ (Embeddings)│     │ (Vector DB) │
└─────────────────┘     └─────────────┘     └─────────────┘
                                                   │
                                                   ▼
                                           ┌─────────────┐
                                           │   Search    │
                                           │    API      │
                                           └─────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/bledden/Documents/kre8/scripts/sound-catalog
pip install -r requirements.txt
```

Note: First run will download BGE-M3 (~2.3GB).

### 2. Build Sound Catalog

```bash
python build_catalog.py
```

Creates `sound_catalog.json` with ~150 sounds.

### 3. Generate Embeddings

```bash
python generate_embeddings.py
```

Creates `sound_catalog_with_embeddings.json` (~2-5 min on first run).

### 4. Start arrwDB

```bash
cd /Users/bledden/Documents/arrwDB
PORT=8001 python3 run_api.py
```

arrwDB will run at http://localhost:8001 (port 8001 to avoid conflicts)

### 5. Load into arrwDB

```bash
python load_to_arrwdb.py
```

This uploads all sounds to the `strudel-sounds` library.

## Usage

### Search API

```bash
curl -X POST http://localhost:8001/v1/libraries/strudel-sounds/search \
  -H "Content-Type: application/json" \
  -d '{"query": "warm pad ambient", "k": 5}'
```

### From Node.js (Kre8 backend)

```typescript
const response = await fetch('http://localhost:8001/v1/libraries/strudel-sounds/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'warm pad ambient', k: 5 })
});
const results = await response.json();
// results.results[0].document_title === "gm_pad_2_warm"
```

## Sound Sources

| Source | Count | Description |
|--------|-------|-------------|
| `soundfonts` | ~100 | General MIDI instruments (gm_*) |
| `dirt-samples` | ~40 | TidalCycles sample banks |
| `builtin` | 6 | Oscillators (sine, saw, square...) |

## Model Info

**BGE-M3** (BAAI):
- 1024 dimensions
- 72% retrieval accuracy (MTEB)
- MIT license
- 8192 token context

## Files

```
sound-catalog/
├── requirements.txt           # Python dependencies
├── build_catalog.py          # Generate sound_catalog.json
├── generate_embeddings.py    # Generate embeddings with BGE-M3
├── load_to_arrwdb.py        # Upload to arrwDB
├── sound_catalog.json        # Generated: sound metadata
└── sound_catalog_with_embeddings.json  # Generated: with vectors
```

## No Cohere Needed!

This setup bypasses Cohere entirely by:
1. Using BGE-M3 locally for embeddings
2. Using arrwDB's `/documents/batch-with-embeddings` endpoint
3. Using arrwDB's `/search/embedding` endpoint (or standard search)

Zero external API calls. Zero cost. Works offline.
