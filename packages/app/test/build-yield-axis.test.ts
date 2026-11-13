import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

it.each([
    [612, 0, { step: 500, top: 1000, bottom: 0, gridlines: [0, 500, 1000] }],
    [38, 0, { step: 20, top: 40, bottom: 0, gridlines: [0, 20, 40] }],
    [50, 0, { step: 25, top: 50, bottom: 0, gridlines: [0, 25, 50] }],
    [100, -12, { step: 100, top: 100, bottom: -100, gridlines: [-100, 0, 100] }],
    [0, 0, { step: 1, top: 1, bottom: 0, gridlines: [0, 1] }]
])('steps (%d, %d) at a nice value with zero on a gridline', (max, min, expected) => {
    expect(buildYieldAxis(max, min)).toEqual(expected);
});
