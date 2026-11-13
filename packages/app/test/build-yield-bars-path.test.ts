import { expect, it } from '@effect/vitest';

import { buildYieldBarsPath } from '../src/yield/utils/build-yield-bars-path.util';

const rects = [
    { x: 10, y: 0, width: 20, height: 0, radius: 4 },
    { x: 40, y: 0, width: 20, height: 0, radius: 4 }
];

it('skips rects whose animated height is not visible and rounds the top of the rest', () => {
    expect(buildYieldBarsPath([80, 20, 100, 0], 0, rects)).toBe('M10,100V84Q10,80,14,80H26Q30,80,30,84V100Z');
});

it('reads the animated values from the offset and clamps the radius to the height', () => {
    expect(buildYieldBarsPath([7, 7, 0, 0, 98, 2], 2, rects)).toBe('M40,100V100Q40,98,42,98H58Q60,98,60,100V100Z');
});
