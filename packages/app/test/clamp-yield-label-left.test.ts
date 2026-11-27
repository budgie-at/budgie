import { expect, it } from '@effect/vitest';

import { clampYieldLabelLeft } from '../src/yield/utils/clamp-yield-label-left.util';

const PLOT_WIDTH = 270;

it.each([
    [135, 40, 115],
    [PLOT_WIDTH - 4, 40, PLOT_WIDTH - 40],
    [6, 38, 0]
])('clamps a label centred at %d with width %d to left %d', (centre, labelWidth, expected) => {
    expect(clampYieldLabelLeft(centre, labelWidth, 0, PLOT_WIDTH)).toBe(expected);
});

it('never overflows either edge across the plot', () => {
    const labelWidth = 44;

    Array.from({ length: PLOT_WIDTH + 1 }, (_, centre) => centre).forEach(centre => {
        const left = clampYieldLabelLeft(centre, labelWidth, 0, PLOT_WIDTH);

        expect(left).toBeGreaterThanOrEqual(0);
        expect(left + labelWidth).toBeLessThanOrEqual(PLOT_WIDTH);
    });
});
