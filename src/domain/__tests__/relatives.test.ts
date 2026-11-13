import { describe, expect, it } from 'vitest';
import { indexFamily, relativesOf, siblingsOf } from '../genealogy';
import { family, person, sampleFamily, union } from './fixtures';

const index = indexFamily(sampleFamily());

describe('siblingsOf', () => {
  it('lists the other children of the same parents', () => {
    expect(siblingsOf(index, 'kid1')).toEqual(['kid2']);
    expect(siblingsOf(index, 'dad')).toEqual(['aunt']);
  });

  it('includes half-siblings from another union of a parent', () => {
    expect(siblingsOf(index, 'cousin1')).toEqual(['cousin2']);
  });

  it('is empty for the root couple and for grafts', () => {
    expect(siblingsOf(index, 'grandpa')).toEqual([]);
    expect(siblingsOf(index, 'mom')).toEqual([]);
  });

  it('lists each sibling once when both parents share them', () => {
    const shared = indexFamily(
      family(
        ['a', 'b', 'c', 'd'].map((id) => person(id)),
        [union('u', ['a', 'b'], ['c', 'd'])],
        'u',
      ),
    );
    expect(siblingsOf(shared, 'c')).toEqual(['d']);
  });
});

describe('relativesOf', () => {
  it('groups parents, partners, children and siblings', () => {
    expect(relativesOf(index, 'kid1')).toEqual({
      parents: ['dad', 'mom'],
      partners: ['kid1-wife'],
      children: ['grandkid'],
      siblings: ['kid2'],
    });
  });

  it('throws on unknown ids', () => {
    expect(() => relativesOf(index, 'nobody')).toThrow('nobody');
  });
});
