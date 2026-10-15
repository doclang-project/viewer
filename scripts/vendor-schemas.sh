#!/usr/bin/env bash
# Vendors the DocLang XSDs into schema/ (one file per minor version) and writes schema/versions.json.
# To add a release, append its tag to TAGS (oldest first) and re-run; the last tag becomes the default.
set -euo pipefail

TAGS=(v0.7.3 v0.8.0)
BASE="https://raw.githubusercontent.com/doclang-project/doclang/refs/tags"

mkdir -p "$(dirname "$0")/../schema"
cd "$(dirname "$0")/../schema"

entries=()
for tag in "${TAGS[@]}"; do
  minor="$(echo "${tag#v}" | cut -d. -f1,2)"
  file="doclang-${minor}.xsd"
  curl -fsSL "${BASE}/${tag}/doclang/doclang.xsd" -o "${file}"
  entries+=("    \"${minor}\": { \"file\": \"${file}\", \"tag\": \"${tag}\" }")
  default="${minor}"
  echo "${tag} -> schema/${file}"
done

{
  printf '{\n  "default": "%s",\n  "versions": {\n' "${default}"
  last=$(( ${#entries[@]} - 1 ))
  for i in "${!entries[@]}"; do
    if [ "$i" -lt "$last" ]; then printf '%s,\n' "${entries[$i]}"; else printf '%s\n' "${entries[$i]}"; fi
  done
  printf '  }\n}\n'
} > versions.json
echo "default: ${default}"
