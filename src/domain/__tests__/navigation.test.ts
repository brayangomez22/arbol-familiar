import { describe, expect, it } from 'vitest';
import { indexFamily } from '../genealogy';
import { relativeInDirection, type Direction } from '../navigation';
import { sampleFamily } from './fixtures';

const index = indexFamily(sampleFamily());

/** Fruits from left to right as they might be drawn. */
const ORDER = [
  'cousin1',
  'uncle1',
  'uncle2',
  'aunt',
  'cousin2',
  'grandpa',
  'grandma',
  'kid2',
  'dad',
  'mom',
  'grandkid',
  'kid1',
  'kid1-wife',
];
const xOf = (id: string) => ORDER.indexOf(id);
const move = (id: string, direction: Direction) => relativeInDirection(index, id, direction, xOf);

describe('relativeInDirection', () => {
  it('goes up to the parent whose branch the person grows from', () => {
    expect(move('kid1', 'up')).toBe('dad');
    expect(move('cousin2', 'up')).toBe('aunt');
  });

  it('goes up from a graft to the partner they hang from', () => {
    expect(move('mom', 'up')).toBe('dad');
    expect(move('kid1-wife', 'up')).toBe('kid1');
  });

  it('stops at the root couple', () => {
    expect(move('grandpa', 'up')).toBeUndefined();
  });

  it('goes down to the child closest below', () => {
    expect(move('grandpa', 'down')).toBe('aunt');
    expect(move('grandma', 'down')).toBe('dad');
    expect(move('aunt', 'down')).toBe('cousin2');
    expect(move('kid1-wife', 'down')).toBe('grandkid');
    expect(move('kid2', 'down')).toBeUndefined();
  });

  it('moves sideways along the fork, partners included, in drawing order', () => {
    expect(move('dad', 'left')).toBe('aunt');
    expect(move('aunt', 'left')).toBe('uncle2');
    expect(move('dad', 'right')).toBe('mom');
    expect(move('mom', 'right')).toBeUndefined();
    expect(move('kid1', 'left')).toBe('kid2');
    expect(move('kid1', 'right')).toBe('kid1-wife');
  });

  it('moves between the root partners', () => {
    expect(move('grandpa', 'right')).toBe('grandma');
    expect(move('grandma', 'left')).toBe('grandpa');
  });
});
