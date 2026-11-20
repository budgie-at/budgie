import { expect, it } from '@effect/vitest';

import { buildYieldAxisLabels } from '../src/yield/utils/build-yield-axis-labels.util';

const format = (value: number) => `$${value}`;
const keysOf = (top: number, bottom: number) => buildYieldAxisLabels({ top, bottom, depth: -bottom }, 200, format).map(label => label.key);

it('shows top, mid and zero labels and never a negative label', () => {
    expect(keysOf(100, 0)).toEqual(['top', 'mid', 'zero']);
    expect(keysOf(1400, -73)).toEqual(['top', 'mid', 'zero']);
    expect(keysOf(100, -40)).toEqual(['top', 'mid', 'zero']);
});

it('places zero at a fixed y when the negative band is a fixed pixel height', () => {
    const labels = buildYieldAxisLabels({ top: 176, bottom: -24, depth: 10 }, 200, format);

    expect(labels.find(label => label.key === 'zero')?.y).toBeCloseTo(176, 6);
});
