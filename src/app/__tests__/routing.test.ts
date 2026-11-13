import { describe, expect, it } from 'vitest';
import { personIdFromHash, urlForPerson } from '../routing';

const people = new Set(['ana-alvarez', 'jose-gomez']);
const isPerson = (id: string) => people.has(id);

describe('personIdFromHash', () => {
  it('reads the person from the hash', () => {
    expect(personIdFromHash('#ana-alvarez', isPerson)).toBe('ana-alvarez');
    expect(personIdFromHash('ana-alvarez', isPerson)).toBe('ana-alvarez');
  });

  it('forgives encoding and case from hand-typed links', () => {
    expect(personIdFromHash('#Ana-Alvarez', isPerson)).toBe('ana-alvarez');
    expect(personIdFromHash('#%20jose-gomez', isPerson)).toBe('jose-gomez');
  });

  it('ignores empty, unknown and malformed hashes', () => {
    expect(personIdFromHash('', isPerson)).toBeNull();
    expect(personIdFromHash('#', isPerson)).toBeNull();
    expect(personIdFromHash('#nadie', isPerson)).toBeNull();
    expect(personIdFromHash('#%E0%A4%A', isPerson)).toBeNull();
  });
});

describe('urlForPerson', () => {
  it('sets the hash and keeps the rest of the address', () => {
    expect(urlForPerson('https://x.co/arbol/?q=1', 'ana-alvarez')).toBe(
      'https://x.co/arbol/?q=1#ana-alvarez',
    );
    expect(urlForPerson('https://x.co/#jose-gomez', 'ana-alvarez')).toBe(
      'https://x.co/#ana-alvarez',
    );
  });

  it('drops the hash, without a bare "#", for nobody', () => {
    expect(urlForPerson('https://x.co/arbol/#ana-alvarez', null)).toBe('https://x.co/arbol/');
    expect(urlForPerson('https://x.co/arbol/', null)).toBe('https://x.co/arbol/');
  });
});
