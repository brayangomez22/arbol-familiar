import { describe, expect, it } from 'vitest';
import { matchScore, normalizeText, searchEntryOf, searchPeople } from '../search';
import { person } from './fixtures';

const entries = [
  person('lucia-gomez', { firstName: 'Lucía', lastName: 'Gómez' }),
  person('luis-gomez', { firstName: 'Luis', lastName: 'Gómez' }),
  person('jorge-gomez', { firstName: 'Jorge', lastName: 'Gómez', nickname: 'el Mono' }),
  person('jose-gomez', { firstName: 'José', lastName: 'Gómez', nickname: 'Don José' }),
  person('pedro-alvarez', { firstName: 'Pedro', lastName: 'Álvarez' }),
].map(searchEntryOf);

const ids = (query: string) => searchPeople(entries, query, 10).map((result) => result.id);

describe('normalizeText', () => {
  it('drops accents, case and extra spaces', () => {
    expect(normalizeText('  Lucía   ÁLVAREZ ')).toBe('lucia alvarez');
    expect(normalizeText('Ñoño')).toBe('nono');
  });
});

describe('searchPeople', () => {
  it('finds "lucia" ⇒ Lucía', () => {
    expect(ids('lucia')[0]).toBe('lucia-gomez');
  });

  it('finds by nickname', () => {
    expect(ids('mono')).toEqual(['jorge-gomez']);
  });

  it('ranks the best match first and breaks ties alphabetically', () => {
    expect(ids('lu')).toEqual(['lucia-gomez', 'luis-gomez']);
    expect(ids('luis')[0]).toBe('luis-gomez');
  });

  it('needs every query word to match, in any order', () => {
    expect(ids('gomez jose')).toEqual(['jose-gomez']);
    expect(ids('pedro gomez')).toEqual([]);
  });

  it('forgives small typos', () => {
    expect(ids('lusia')).toContain('lucia-gomez');
    expect(ids('alvraez')).toEqual(['pedro-alvarez']);
  });

  it('returns nothing for an empty query and honors the limit', () => {
    expect(ids('   ')).toEqual([]);
    expect(searchPeople(entries, 'gomez', 2)).toHaveLength(2);
  });
});

describe('matchScore', () => {
  it('prefers exact, then prefix, substring, typo and subsequence', () => {
    const scores = [
      matchScore('lucia', 'lucia'),
      matchScore('luc', 'lucia'),
      matchScore('uci', 'lucia'),
      matchScore('lucai', 'lucia'),
      matchScore('lca', 'lucia'),
    ];
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(new Set(scores).size).toBe(scores.length);
  });

  it('does not match short words loosely', () => {
    expect(matchScore('lx', 'lucia')).toBe(0);
    expect(matchScore('lia', 'lucia')).toBeGreaterThan(0);
    expect(matchScore('xyz', 'lucia')).toBe(0);
  });
});
