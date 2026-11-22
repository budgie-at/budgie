import { expect, it } from '@effect/vitest';

import { buildYieldAxisLabels } from '../src/yield/utils/build-yield-axis-labels.util';

const format = (value: number) => `$${value}`;
const labelsOf = (top: number, step: number, bottom: number) => buildYieldAxisLabels({ top, bottom, step }, 200, format);

it('labels every step from the top down to zero', () => {
    expect(labelsOf(1500, 500, 0).map(label => label.text)).toEqual(['$1500', '$1000', '$500', '$0']);
    expect(labelsOf(100, 50, -40).map(label => label.key)).toEqual(['top', 'tick-1', 'zero']);
});

it('places zero at a fixed y when the negative band is a fixed pixel height', () => {
    const labels = labelsOf(176, 88, -24);

    expect(labels.find(label => label.key === 'zero')?.y).toBeCloseTo(176, 6);
});
