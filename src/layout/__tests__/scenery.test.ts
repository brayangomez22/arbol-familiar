import { describe, expect, it } from 'vitest';
import { SCENERY } from '@/config/constants';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { buildTreeLayout } from '../buildTreeLayout';
import { buildRidges, placeClouds, placeFireflies, placePollen } from '../scenery';
import { groundHeight, groundNormal, placeGrass } from '../terrain';
import { length, vec3 } from '../vec';

const { bounds } = buildTreeLayout(loadFamily(familyJson));
const top = vec3(0.5, 0, -0.3);
const { hill, grass, clouds, ridges, seed } = SCENERY;

describe('groundHeight', () => {
  it('is highest at the hilltop and falls toward the plain', () => {
    expect(groundHeight(top.x, top.z, top, hill)).toBeCloseTo(0, 9);
    expect(groundHeight(top.x + 10, top.z, top, hill)).toBeLessThan(0);
    expect(groundHeight(top.x, top.z - 1000, top, hill)).toBeCloseTo(-hill.drop, 6);
  });

  it('drops faster behind the tree than to its sides', () => {
    expect(groundHeight(top.x, top.z - 15, top, hill)).toBeLessThan(
      groundHeight(top.x + 15, top.z, top, hill),
    );
  });

  it('has an upward normal that leans away from the top', () => {
    const flat = groundNormal(top.x, top.z, top, hill);
    expect(flat.y).toBeCloseTo(1, 9);
    const side = groundNormal(top.x + 10, top.z, top, hill);
    expect(length(side)).toBeCloseTo(1, 9);
    expect(side.x).toBeGreaterThan(0);
  });
});

describe('placeGrass', () => {
  const blades = placeGrass(500, top, 4, hill, grass, seed);

  it('is deterministic and gives as many blades as asked', () => {
    expect(placeGrass(500, top, 4, hill, grass, seed)).toEqual(blades);
    expect(blades.length).toBeLessThanOrEqual(500);
    expect(blades.length).toBeGreaterThan(400);
  });

  it('roots every blade on the ground, clear of the trunk', () => {
    for (const blade of blades) {
      const { x, y, z } = blade.position;
      expect(y).toBeCloseTo(groundHeight(x, z, top, hill), 9);
      expect(Math.hypot(x - top.x, z - top.z)).toBeGreaterThanOrEqual(grass.innerRadius);
    }
  });
});

describe('placeClouds', () => {
  const placed = placeClouds(bounds, clouds, seed);

  it('is deterministic and fills every layer', () => {
    expect(placeClouds(bounds, clouds, seed)).toEqual(placed);
    const total = clouds.layers.reduce((sum, layer) => sum + layer.count, 0);
    expect(placed).toHaveLength(total);
  });

  it('keeps every cloud behind the tree and above its center', () => {
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    for (const cloud of placed) {
      expect(cloud.position.z).toBeLessThan(bounds.min.z);
      expect(cloud.position.y).toBeGreaterThan(centerY);
      expect(cloud.puffs.length).toBeGreaterThanOrEqual(clouds.minPuffs);
    }
  });
});

describe('buildRidges', () => {
  it('stays below the tree so the crown stands against the sky', () => {
    for (const ridge of buildRidges(bounds, ridges, seed)) {
      for (const point of ridge.line) {
        expect(point.y).toBeLessThan(
          bounds.min.y + Math.max(...ridges.layers.map((l) => l.height)),
        );
      }
    }
  });
});

describe('placePollen', () => {
  it('is deterministic and stays above the ground, around the tree', () => {
    const motes = placePollen(200, bounds, SCENERY.pollen, seed);
    expect(placePollen(200, bounds, SCENERY.pollen, seed)).toEqual(motes);
    expect(motes).toHaveLength(200);
    for (const mote of motes) {
      expect(mote.position.y).toBeGreaterThanOrEqual(0);
      expect(mote.position.x).toBeGreaterThanOrEqual(bounds.min.x - SCENERY.pollen.padding);
      expect(mote.position.x).toBeLessThanOrEqual(bounds.max.x + SCENERY.pollen.padding);
    }
  });
});

describe('placeFireflies', () => {
  const config = SCENERY.fireflies;

  it('is deterministic, above the ground and around the tree', () => {
    const flies = placeFireflies(120, bounds, config, seed);
    expect(placeFireflies(120, bounds, config, seed)).toEqual(flies);
    for (const fly of flies) {
      expect(fly.position.y).toBeGreaterThanOrEqual(0);
      expect(fly.position.x).toBeGreaterThanOrEqual(bounds.min.x - config.padding);
      expect(fly.position.x).toBeLessThanOrEqual(bounds.max.x + config.padding);
      expect(fly.blink).toBeGreaterThanOrEqual(config.blinkSpeed[0]);
      expect(fly.blink).toBeLessThanOrEqual(config.blinkSpeed[1]);
    }
  });

  it('keeps a share of them low over the grass', () => {
    const flies = placeFireflies(400, bounds, config, seed);
    const floor = Math.max(bounds.min.y, 0);
    const low = flies.filter((fly) => fly.position.y <= floor + config.lowHeight).length;
    expect(low / flies.length).toBeGreaterThan(config.lowShare * 0.8);
  });
});
