import type { LibraryResource } from "@/types/library";

const SEARCH_STOP_WORDS = new Set(["de", "del", "la", "el", "para", "en", "con"]);

export function normalizeLibrarySearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/½/g, " 1/2 ")
    .replace(/¾/g, " 3/4 ")
    .replace(/¼/g, " 1/4 ")
    .replace(/#/g, " ")
    .replace(/\bcal(?:ibre)?\s*(\d+)\b/g, " $1 awg ")
    .replace(/\b(\d+)\s*awg\b/g, " $1 awg ")
    .replace(/thhn\s*\/\s*thwn(?:-?2)?/g, " thhn thwn thwn-2 ")
    .replace(/thhn-thwn(?:-?2)?/g, " thhn thwn thwn-2 ")
    .replace(/sch\s*-?\s*(\d+)/g, " sch-$1 schedule-$1 ")
    .replace(/sdr\s*-?\s*(\d+)/g, " sdr-$1 ")
    .replace(/[^a-z0-9/.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchCorpus(resource: LibraryResource): string {
  return normalizeLibrarySearchText([
    resource.code,
    resource.name,
    resource.unit,
    resource.supplier ?? "",
    resource.description ?? "",
    resource.category ?? "",
    resource.subcategory ?? "",
    resource.brand ?? "",
    resource.observations ?? "",
    ...resource.tags,
  ].join(" "));
}

export function librarySearchScore(resource: LibraryResource, query: string): number {
  const normalizedQuery = normalizeLibrarySearchText(query);
  if (!normalizedQuery) return 1;

  const corpus = searchCorpus(resource);
  const name = normalizeLibrarySearchText(resource.name);
  const tokens = normalizedQuery
    .split(" ")
    .filter((token) => token && !SEARCH_STOP_WORDS.has(token));

  if (tokens.length === 0) return 1;
  if (!tokens.every((token) => corpus.includes(token))) return 0;

  let score = 100;
  if (corpus.includes(normalizedQuery)) score += 80;
  if (name.includes(normalizedQuery)) score += 120;

  for (const token of tokens) {
    if (name.includes(token)) score += 20;
    if (resource.code.toLowerCase().includes(token)) score += 8;
  }

  // Premia coincidencias técnicas explícitas (calibre, diámetro, schedule, etc.).
  score += tokens.filter((token) => /\d/.test(token)).length * 12;
  return score;
}

export function matchesLibrarySearch(resource: LibraryResource, query: string): boolean {
  return librarySearchScore(resource, query) > 0;
}
