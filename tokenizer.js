// Minimal byte-level BPE tokenizer, reading standard HF `tokenizer.json` assets
// directly in the browser so DocLang source text can be tokenized client-side
// with the same std / std_ext tokenizers used in the tokenization comparisons.
// See https://github.com/vagenas/tokenization for how the assets are produced.

const TOKENIZER_STD_URL = "assets/tokenizer-std.json";
const TOKENIZER_STD_EXT_ADDED_URL = "assets/tokenizer-std-ext-added.json";
const MERGE_RANK_SEP = "\u0001";

function bytesToUnicodeMap() {
  const bytes = [];
  for (let i = 33; i <= 126; i++) bytes.push(i);
  for (let i = 161; i <= 172; i++) bytes.push(i);
  for (let i = 174; i <= 255; i++) bytes.push(i);
  const chars = bytes.slice();
  let extra = 0;
  for (let b = 0; b < 256; b++) {
    if (!bytes.includes(b)) {
      bytes.push(b);
      chars.push(256 + extra);
      extra++;
    }
  }
  const byteToChar = new Map();
  const charToByte = new Map();
  for (let i = 0; i < bytes.length; i++) {
    const ch = String.fromCodePoint(chars[i]);
    byteToChar.set(bytes[i], ch);
    charToByte.set(ch, bytes[i]);
  }
  return { byteToChar, charToByte };
}

// A Split pretokenizer with `invert: true` yields its regex *matches* as the
// pretoken chunks (equivalent to `re.findall`). Rust's `(?i:...)` scoped-flag
// group has no JS equivalent; since it only wraps case-sensitive literals
// here, applying "i" to the whole pattern is behavior-preserving.
function compilePretokenizeRegex(source) {
  const jsSource = source.replace(/\(\?i:/g, "(?:");
  return new RegExp(jsSource, "gui");
}

class AddedTokenTrie {
  constructor() {
    this.root = {};
  }

  insert(content, id) {
    let node = this.root;
    for (const ch of content) {
      node = node.children ? node.children : (node.children = {});
      node = node[ch] || (node[ch] = {});
    }
    node.match = { id, content };
  }

  // Longest match starting exactly at text[i], or null.
  matchAt(text, i) {
    let node = this.root;
    let best = null;
    let j = i;
    while (j < text.length && node.children) {
      node = node.children[text[j]];
      if (!node) break;
      j++;
      if (node.match) best = { end: j, id: node.match.id, content: node.match.content };
    }
    return best;
  }
}

// Byte-level BPE operates per-byte, but a multi-byte UTF-8 character (e.g. an
// emoji) produces several bytes that all belong to the same source character.
// A merge can pull in only some of those bytes (leaving the rest to merge
// separately), so only the character's *last* byte may claim its true end
// offset; earlier bytes of the same character report a zero-width end at the
// character's start, deferring the claim until the byte that completes it.
// This keeps every final token's span exact with no overlaps or gaps.
function chunkToBytes(chunkText, chunkStart, byteToChar) {
  const encoder = new TextEncoder();
  const syms = [];
  const charStarts = [];
  const charEnds = [];
  let i = 0;
  for (const ch of chunkText) {
    const bytes = encoder.encode(ch);
    const start = chunkStart + i;
    const end = start + ch.length;
    bytes.forEach((b, bi) => {
      syms.push(byteToChar.get(b));
      charStarts.push(start);
      charEnds.push(bi === bytes.length - 1 ? end : start);
    });
    i += ch.length;
  }
  return { syms, charStarts, charEnds };
}

function applyBpeMerges(syms, mergeRank) {
  let arr = syms.map((sym, idx) => ({ sym, byteStart: idx, byteEnd: idx + 1 }));
  for (;;) {
    let bestRank = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < arr.length - 1; i++) {
      const rank = mergeRank.get(arr[i].sym + MERGE_RANK_SEP + arr[i + 1].sym);
      if (rank !== undefined && rank < bestRank) {
        bestRank = rank;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    const merged = {
      sym: arr[bestIdx].sym + arr[bestIdx + 1].sym,
      byteStart: arr[bestIdx].byteStart,
      byteEnd: arr[bestIdx + 1].byteEnd,
    };
    arr.splice(bestIdx, 2, merged);
  }
  return arr;
}

class BpeTokenizer {
  constructor({ vocab, merges, addedTokens, pretokenizeRegexSource }) {
    this.vocab = vocab;
    this.mergeRank = new Map();
    merges.forEach(([a, b], rank) => this.mergeRank.set(a + MERGE_RANK_SEP + b, rank));
    const { byteToChar, charToByte } = bytesToUnicodeMap();
    this.byteToChar = byteToChar;
    this.charToByte = charToByte;
    this.pretokenizeRegex = compilePretokenizeRegex(pretokenizeRegexSource);
    this.addedTrie = new AddedTokenTrie();
    for (const t of addedTokens) this.addedTrie.insert(t.content, t.id);
    this.idToToken = new Map();
    for (const [tok, id] of vocab) this.idToToken.set(id, tok);
    for (const t of addedTokens) this.idToToken.set(t.id, t.content);
  }

  // Decode a single vocab/added token's byte-level symbol back to display text.
  displayText(tokenSym) {
    const bytes = [];
    for (const ch of tokenSym) {
      const b = this.charToByte.get(ch);
      bytes.push(b === undefined ? ch.codePointAt(0) & 0xff : b);
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  }

  tokenTextForId(id) {
    const sym = this.idToToken.get(id);
    if (sym === undefined) return "";
    return this.displayText(sym);
  }

  encode(text) {
    const tokens = [];
    let pos = 0;
    while (pos < text.length) {
      const special = this.addedTrie.matchAt(text, pos);
      if (special) {
        tokens.push({ id: special.id, start: pos, end: special.end, special: true });
        pos = special.end;
        continue;
      }
      let nextSpecial = text.length;
      for (let i = pos + 1; i < text.length; i++) {
        if (this.addedTrie.matchAt(text, i)) {
          nextSpecial = i;
          break;
        }
      }
      const segment = text.slice(pos, nextSpecial);
      this.pretokenizeRegex.lastIndex = 0;
      let match;
      while ((match = this.pretokenizeRegex.exec(segment)) !== null) {
        const chunkText = match[0];
        if (chunkText.length === 0) {
          this.pretokenizeRegex.lastIndex++;
          continue;
        }
        const chunkStart = pos + match.index;
        const { syms, charStarts, charEnds } = chunkToBytes(chunkText, chunkStart, this.byteToChar);
        const merged = applyBpeMerges(syms, this.mergeRank);
        for (const node of merged) {
          const id = this.vocab.get(node.sym);
          tokens.push({
            id: id ?? -1,
            start: charStarts[node.byteStart],
            end: charEnds[node.byteEnd - 1],
            special: false,
          });
        }
      }
      pos = nextSpecial;
    }
    return tokens;
  }
}

let tokenizerAssetsPromise = null;

async function loadTokenizerAssets() {
  if (!tokenizerAssetsPromise) {
    tokenizerAssetsPromise = Promise.all([
      fetch(TOKENIZER_STD_URL, { cache: "no-cache" }).then((r) => r.json()),
      fetch(TOKENIZER_STD_EXT_ADDED_URL, { cache: "no-cache" }).then((r) => r.json()),
    ]).then(([stdJson, extAdded]) => {
      const vocab = new Map(Object.entries(stdJson.model.vocab));
      const merges = stdJson.model.merges;
      const pretokenizeRegexSource = stdJson.pre_tokenizer.pretokenizers[0].pattern.Regex;
      const baseAdded = stdJson.added_tokens.map((t) => ({ content: t.content, id: t.id }));

      const std = new BpeTokenizer({ vocab, merges, addedTokens: baseAdded, pretokenizeRegexSource });
      const stdExt = new BpeTokenizer({
        vocab,
        merges,
        addedTokens: baseAdded.concat(extAdded),
        pretokenizeRegexSource,
      });
      return { std, stdExt, addedDoclangTokenCount: extAdded.length };
    });
  }
  return tokenizerAssetsPromise;
}

window.DoclangTokenizers = { loadTokenizerAssets };
