import { describe, expect, it } from 'vitest';
import {
  ancestors,
  bloodPartnerOf,
  childrenOf,
  descendants,
  generationOf,
  indexFamily,
  isBlood,
  isGraft,
  lineagePath,
  parentsOf,
  partnersOf,
} from '../genealogy';
import { sampleFamily } from './fixtures';

const index = indexFamily(sampleFamily());

describe('direct relations', () => {
  it('finds parents, partners and children', () => {
    expect(parentsOf(index, 'kid1')).toEqual(['dad', 'mom']);
    expect(parentsOf(index, 'grandpa')).toEqual([]);
    expect(partnersOf(index, 'aunt')).toEqual(['uncle1', 'uncle2']);
    expect(childrenOf(index, 'aunt')).toEqual(['cousin1', 'cousin2']);
    expect(childrenOf(index, 'kid2')).toEqual([]);
  });

  it('throws on unknown ids', () => {
    expect(() => ancestors(index, 'nobody')).toThrow('nobody');
  });
});

describe('ancestors and descendants', () => {
  it('lists ancestors nearest first', () => {
    expect(ancestors(index, 'grandkid')).toEqual([
      'kid1-wife',
      'kid1',
      'dad',
      'mom',
      'grandpa',
      'grandma',
    ]);
  });

  it('lists blood descendants nearest first, without grafts', () => {
    expect(descendants(index, 'grandpa')).toEqual([
      'dad',
      'aunt',
      'kid1',
      'kid2',
      'cousin1',
      'cousin2',
      'grandkid',
    ]);
    expect(descendants(index, 'grandkid')).toEqual([]);
  });
});

describe('blood and grafts', () => {
  it('treats root partners and children as blood', () => {
    expect(isBlood(index, 'grandma')).toBe(true);
    expect(isBlood(index, 'cousin2')).toBe(true);
  });

  it('treats partners who married in as grafts', () => {
    expect(isGraft(index, 'mom')).toBe(true);
    expect(isGraft(index, 'uncle2')).toBe(true);
    expect(bloodPartnerOf(index, 'kid1-wife')).toBe('kid1');
    expect(bloodPartnerOf(index, 'kid1')).toBeUndefined();
  });
});

describe('generationOf', () => {
  it.each([
    ['grandpa', 0],
    ['grandma', 0],
    ['dad', 1],
    ['mom', 1],
    ['uncle2', 1],
    ['kid1', 2],
    ['kid1-wife', 2],
    ['cousin2', 2],
    ['grandkid', 3],
  ])('%s is generation %i', (id, generation) => {
    expect(generationOf(index, id)).toBe(generation);
  });
});

describe('lineagePath', () => {
  it('goes from the trunk to the person through blood partners', () => {
    expect(lineagePath(index, 'grandkid')).toEqual(['grandpa', 'dad', 'kid1', 'grandkid']);
    expect(lineagePath(index, 'cousin2')).toEqual(['grandpa', 'aunt', 'cousin2']);
    expect(lineagePath(index, 'grandma')).toEqual(['grandma']);
  });

  it('ends a graft path at the graft, after their blood partner', () => {
    expect(lineagePath(index, 'kid1-wife')).toEqual(['grandpa', 'dad', 'kid1', 'kid1-wife']);
  });
});
