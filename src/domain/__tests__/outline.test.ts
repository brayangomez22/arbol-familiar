import { describe, expect, it } from 'vitest';
import { indexFamily } from '../genealogy';
import { familyOutline, type OutlineUnion } from '../outline';
import { sampleFamily } from './fixtures';

/** Every person in the outline, in reading order. */
function readingOrder(union: OutlineUnion): string[] {
  return [
    ...union.partners,
    ...union.children.flatMap((child) => [
      child.id,
      ...child.unions.flatMap((childUnion) =>
        readingOrder(childUnion).filter((id) => id !== child.id),
      ),
    ]),
  ];
}

describe('familyOutline', () => {
  const outline = familyOutline(indexFamily(sampleFamily()));

  it('starts at the root couple with their children in order', () => {
    expect(outline.partners).toEqual(['grandpa', 'grandma']);
    expect(outline.children.map((child) => child.id)).toEqual(['dad', 'aunt']);
  });

  it('nests every couple of a person, with its own children', () => {
    const aunt = outline.children[1];
    expect(aunt?.unions.map((union) => union.partners)).toEqual([
      ['aunt', 'uncle1'],
      ['uncle2', 'aunt'],
    ]);
    expect(aunt?.unions.map((union) => union.children.map((child) => child.id))).toEqual([
      ['cousin1'],
      ['cousin2'],
    ]);
  });

  it('lists everyone exactly once', () => {
    const ids = readingOrder(outline);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(sampleFamily().people.size);
  });
});
