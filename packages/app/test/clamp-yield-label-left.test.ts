import { expect, it } from '@effect/vitest';

import { clampYieldLabelLeft } from '../src/yield/utils/clamp-yield-label-left.util';

const PLOT_WIDTH = 270;

it('centres a label that fits', () => {
    expect(clampYieldLabelLeft(135, 40, 0, PLOT_WIDTH)).toBe(115);
});

it('aligns the right edge to the plot edge for a label near the end', () => {
    const left = clampYieldLabelLeft(PLOT_WIDTH - 4, 40, 0, PLOT_WIDTH);

    expect(left + 40).toBe(PLOT_WIDTH);
});

it('aligns the left edge to the plot edge for a label near the start', () => {
    expect(clampYieldLabelLeft(6, 38, 0, PLOT_WIDTH)).toBe(0);
});

it('never overflows either edge across the plot', () => {
    const labelWidth = 44;

    Array.from({ length: PLOT_WIDTH + 1 }, (_, centre) => centre).forEach(centre => {
        const left = clampYieldLabelLeft(centre, labelWidth, 0, PLOT_WIDTH);

        expect(left).toBeGreaterThanOrEqual(0);
        expect(left + labelWidth).toBeLessThanOrEqual(PLOT_WIDTH);
    });
});
