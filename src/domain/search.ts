import type { Person, PersonId } from './types';

/** Lowercase without accents or extra spaces: "  Lucía " ⇒ "lucia". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchEntry {
  readonly id: PersonId;
  /** Normalized words of the full name and the nickname. */
  readonly words: readonly string[];
  /** Normalized full name, used to break ties alphabetically. */
  readonly sortKey: string;
}

export interface SearchResult {
  readonly id: PersonId;
  readonly score: number;
}

/** How well one query word matches a name word, best first. 0 means no match. */
const MATCH_SCORE = {
  exact: 5,
  prefix: 4,
  substring: 3,
  /** Typo: one letter wrong, missing, extra or two letters swapped. */
  typo: 2,
  /** The letters appear in order, with gaps ("lca" ⇒ "lucia"). */
  subsequence: 1,
} as const;

/** Shorter words would match almost anything with a typo or as a subsequence. */
const MIN_TYPO_LENGTH = 4;
const MIN_SUBSEQUENCE_LENGTH = 3;

export function searchEntryOf(person: Person): SearchEntry {
  const fullName = normalizeText(`${person.firstName} ${person.lastName}`);
  const nickname = person.nickname === undefined ? '' : normalizeText(person.nickname);
  return {
    id: person.id,
    words: [...fullName.split(' '), ...nickname.split(' ')].filter(Boolean),
    sortKey: fullName,
  };
}

/**
 * Forgiving search by name and nickname: accents and case are ignored, every word of the query
 * must match some word of the person (in any order), and small typos still match.
 */
export function searchPeople(
  entries: readonly SearchEntry[],
  query: string,
  limit: number,
): readonly SearchResult[] {
  const queryWords = normalizeText(query).split(' ').filter(Boolean);
  if (queryWords.length === 0) return [];

  const results: (SearchResult & { readonly sortKey: string })[] = [];
  for (const entry of entries) {
    let score = 0;
    for (const queryWord of queryWords) {
      const best = Math.max(0, ...entry.words.map((word) => matchScore(queryWord, word)));
      if (best === 0) {
        score = 0;
        break;
      }
      score += best;
    }
    if (score > 0) results.push({ id: entry.id, score, sortKey: entry.sortKey });
  }
  results.sort((a, b) => b.score - a.score || a.sortKey.localeCompare(b.sortKey));
  return results.slice(0, limit).map(({ id, score }) => ({ id, score }));
}

export function matchScore(queryWord: string, word: string): number {
  if (word === queryWord) return MATCH_SCORE.exact;
  if (word.startsWith(queryWord)) return MATCH_SCORE.prefix;
  if (word.includes(queryWord)) return MATCH_SCORE.substring;
  if (queryWord.length >= MIN_TYPO_LENGTH && withinOneEdit(queryWord, word)) {
    return MATCH_SCORE.typo;
  }
  // A typo in a word typed only halfway: compare with the start of the name.
  if (
    queryWord.length >= MIN_TYPO_LENGTH &&
    withinOneEdit(queryWord, word.slice(0, queryWord.length))
  ) {
    return MATCH_SCORE.typo;
  }
  if (queryWord.length >= MIN_SUBSEQUENCE_LENGTH && isSubsequence(queryWord, word)) {
    return MATCH_SCORE.subsequence;
  }
  return 0;
}

/** Optimal string alignment distance ≤ 1 (substitution, insertion, deletion or adjacent swap). */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.slice(i + 1) === shorter.slice(i);
}

function isSubsequence(needle: string, haystack: string): boolean {
  let position = 0;
  for (const char of haystack) {
    if (char === needle[position]) position++;
    if (position === needle.length) return true;
  }
  return false;
}
