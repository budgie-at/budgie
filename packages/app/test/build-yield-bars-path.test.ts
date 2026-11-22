import { expect, it } from '@effect/vitest';

import { buildYieldBarsPath } from '../src/yield/utils/build-yield-bars-path.util';

const rects = [
    { x: 10, y: 0, width: 20, height: 0, radius: 4, isInProgress: false },
    { x: 40, y: 0, width: 20, height: 0, radius: 4, isInProgress: false }
];

it('skips rects whose animated height is not visible and rounds the top of the rest', () => {
    expect(buildYieldBarsPath([80, 20, 100, 0], { offset: 0, rects }, false)).toBe(
        'M 10 100 V 84 Q 10 80 14 80 H 26 Q 30 80 30 84 V 100 Z'
    );
});

it('reads the animated values from the offset and clamps the radius to the height', () => {
    expect(buildYieldBarsPath([7, 7, 0, 0, 98, 2], { offset: 2, rects }, false)).toBe(
        'M 40 100 V 100 Q 40 98 42 98 H 58 Q 60 98 60 100 V 100 Z'
    );
});

it('joins several visible rects into one path', () => {
    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects }, false).split('Z').length).toBe(3);
});

it('draws only the rects that match the requested in-progress state', () => {
    const mixed = [
        { x: 10, y: 0, width: 20, height: 0, radius: 4, isInProgress: false },
        { x: 40, y: 0, width: 20, height: 0, radius: 4, isInProgress: true }
    ];

    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: mixed }, true).split('Z').length).toBe(2);
    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: mixed }, true)).toContain('M 40');
    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: mixed }, false)).toContain('M 10');
});

it('draws only the focused bar or everything except it', () => {
    const bars = [
        { x: 10, y: 0, width: 20, height: 0, radius: 4, isInProgress: false },
        { x: 40, y: 0, width: 20, height: 0, radius: 4, isInProgress: false }
    ];

    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: bars }, false, [false, true])).toBe(
        buildYieldBarsPath([50, 50], { offset: 0, rects: [bars[1]] }, false)
    );
    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: bars }, false, [true, false])).toContain('M 10');
    expect(buildYieldBarsPath([80, 20, 50, 50], { offset: 0, rects: bars }, false, [true, false])).not.toContain('M 40');
});
