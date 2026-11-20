import { expect, it } from '@effect/vitest';

import { buildYieldAxisLabels } from '../src/yield/utils/build-yield-axis-labels.util';

const format = (value: number) => `$${value}`;
const keysOf = (top: number, bottom: number) => buildYieldAxisLabels({ top, bottom }, 200, format).map(label => label.key);

it('shows every label when there is no tax depth', () => {
    expect(keysOf(100, 0)).toEqual(['top', 'mid', 'zero']);
});

it('drops the zero label when the negative label would sit on it', () => {
    expect(keysOf(100, -4)).toEqual(['top', 'mid', 'bottom']);
});

it('keeps zero and drops the negative label when the domain is tiny', () => {
    expect(keysOf(1000, -2)).toEqual(['top', 'mid', 'zero']);
});

it('keeps both when there is room', () => {
    expect(keysOf(100, -40)).toEqual(['top', 'mid', 'zero', 'bottom']);
});

it('prefixes the negative label with a minus sign', () => {
    const labels = buildYieldAxisLabels({ top: 100, bottom: -40 }, 200, format);

    expect(labels.at(-1)?.text).toBe('−$40');
});
