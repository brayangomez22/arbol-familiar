import { describe, expect, it } from 'vitest';
import { flightPose, type CameraPose } from '../cameraFly';

const from: CameraPose = { position: { x: 0, y: 10, z: 60 }, target: { x: 0, y: 10, z: 0 } };
const to: CameraPose = { position: { x: 8, y: 16, z: 18 }, target: { x: 8, y: 15, z: 0 } };

function poseAt(progress: number, pullBack: number) {
  const out = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };
  flightPose(from, to, progress, pullBack, out);
  return out;
}

const distance = ({ position, target }: ReturnType<typeof poseAt>) =>
  Math.hypot(position.x - target.x, position.y - target.y, position.z - target.z);

describe('flightPose', () => {
  it('starts and ends exactly on the given poses', () => {
    expect(poseAt(0, 0.25)).toEqual(from);
    const end = poseAt(1, 0.25);
    expect(end.target).toEqual(to.target);
    expect(end.position.x).toBeCloseTo(to.position.x, 9);
    expect(end.position.y).toBeCloseTo(to.position.y, 9);
    expect(end.position.z).toBeCloseTo(to.position.z, 9);
  });

  it('moves the look-at point in a straight line', () => {
    const middle = poseAt(0.5, 0.25).target;
    expect(middle).toEqual({ x: 4, y: 12.5, z: 0 });
  });

  it('breathes out mid-flight, by the pull-back fraction', () => {
    const straight = distance(poseAt(0.5, 0));
    expect(distance(poseAt(0.5, 0.25))).toBeCloseTo(straight * 1.25, 9);
  });
});
