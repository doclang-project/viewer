#!/usr/bin/env bash
# Writes assets/tokenizer-std-ext-added.json: the DocLang special tokens of a release
# (doclang/tokenization.py's get_special_tokens()), with ids following the base vocab of assets/tokenizer-std.json,
# then EXTRA_TOKENS: viewer-only additions the release lacks (appended, so the release's ids stay as they are).
# To update, bump TAG and re-run.
set -euo pipefail

TAG=v0.9.0
URL="https://raw.githubusercontent.com/doclang-project/doclang/refs/tags/${TAG}/doclang/tokenization.py"

cd "$(dirname "$0")/../assets"

tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT
curl -fsSL "${URL}" -o "${tmp}/tokenization.py"

python3 -I - "${tmp}/tokenization.py" <<'EOF'
import json, runpy, sys

# The release's vocabulary only opens <picture> and <code> together with a <label>; unlabeled ones need these.
EXTRA_TOKENS = ["<picture>", "<code>"]

tokens = runpy.run_path(sys.argv[1])["get_special_tokens"]()
extras = [t for t in EXTRA_TOKENS if t not in tokens]
tokens += extras
std = json.load(open("tokenizer-std.json"))
next_id = 1 + max(max(std["model"]["vocab"].values()), *(t["id"] for t in std["added_tokens"]))
added = [{"content": t, "id": next_id + i} for i, t in enumerate(tokens)]
with open("tokenizer-std-ext-added.json", "w") as f:
    json.dump(added, f, ensure_ascii=False)
print(f"{len(added)} tokens ({len(extras)} viewer-only: {', '.join(extras) or 'none'}), ids {next_id}..{next_id + len(added) - 1}")
EOF
echo "${TAG} -> assets/tokenizer-std-ext-added.json"
