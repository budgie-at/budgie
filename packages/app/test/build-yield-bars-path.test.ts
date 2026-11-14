import { expect, it } from '@effect/vitest';

import { buildYieldBarsPath } from '../src/yield/utils/build-yield-bars-path.util';

const rects = [
    { x: 10, y: 0, width: 20, height: 0, radius: 4 },
    { x: 40, y: 0, width: 20, height: 0, radius: 4 }
];

it('skips rects whose animated height is not visible and rounds the top of the rest', () => {
    expect(buildYieldBarsPath([80, 20, 100, 0], 0, rects)).toBe('M 10 100 V 84 Q 10 80 14 80 H 26 Q 30 80 30 84 V 100 Z');
});

it('reads the animated values from the offset and clamps the radius to the height', () => {
    expect(buildYieldBarsPath([7, 7, 0, 0, 98, 2], 2, rects)).toBe('M 40 100 V 100 Q 40 98 42 98 H 58 Q 60 98 60 100 V 100 Z');
});

it('joins several visible rects into one path', () => {
    expect(buildYieldBarsPath([80, 20, 50, 50], 0, rects).split('Z').length).toBe(3);
});
