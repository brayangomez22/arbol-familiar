import { describe, expect, it } from 'vitest';
import { initialQualityTier, readQualityOverride, stepQualityTier } from '../qualityTier';

describe('initialQualityTier', () => {
  it('starts a capable desktop on high', () => {
    expect(initialQualityTier({ coarsePointer: false, cores: 8, memoryGb: 8 }, null)).toEqual({
      tier: 'high',
      pinned: false,
    });
  });

  it('starts a capable phone on medium and a modest one on low', () => {
    expect(initialQualityTier({ coarsePointer: true, cores: 8, memoryGb: 8 }, null).tier).toBe(
      'medium',
    );
    expect(initialQualityTier({ coarsePointer: true, cores: 4 }, null).tier).toBe('low');
    expect(initialQualityTier({ coarsePointer: true, memoryGb: 2 }, null).tier).toBe('low');
  });

  it('starts a modest desktop on medium', () => {
    expect(initialQualityTier({ coarsePointer: false, cores: 2 }, null).tier).toBe('medium');
  });

  it('trusts a device that says nothing about itself', () => {
    expect(initialQualityTier({ coarsePointer: false }, null).tier).toBe('high');
  });

  it('pins the tier forced from the URL', () => {
    expect(initialQualityTier({ coarsePointer: false, cores: 16 }, 'low')).toEqual({
      tier: 'low',
      pinned: true,
    });
  });
});

describe('stepQualityTier', () => {
  it('moves one tier at a time and stops at both ends', () => {
    expect(stepQualityTier('high', -1)).toBe('medium');
    expect(stepQualityTier('medium', -1)).toBe('low');
    expect(stepQualityTier('low', -1)).toBe('low');
    expect(stepQualityTier('low', 1)).toBe('medium');
    expect(stepQualityTier('high', 1)).toBe('high');
  });
});

describe('readQualityOverride', () => {
  it('reads a known tier and ignores anything else', () => {
    expect(readQualityOverride('?quality=low')).toBe('low');
    expect(readQualityOverride('?quality=ultra')).toBeNull();
    expect(readQualityOverride('')).toBeNull();
  });
});
