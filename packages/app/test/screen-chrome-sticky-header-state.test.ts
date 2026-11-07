import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getScreenChromeStickyHeaderState } from '../src/@generic/utils/get-screen-chrome-sticky-header-state.util';

const metrics = [
    { offset: 200, height: 32 },
    { offset: 400, height: 48 },
    { offset: 650, height: 40.5 }
];

it.effect.each([
    { offset: 0, expected: { index: -1, height: 0, translateY: 0 } },
    { offset: 199.9, expected: { index: -1, height: 0, translateY: 0 } },
    { offset: 200, expected: { index: 0, height: 32, translateY: 0 } },
    { offset: 300, expected: { index: 0, height: 32, translateY: 0 } },
    { offset: 380, expected: { index: 0, height: 20, translateY: -12 } },
    { offset: 399.5, expected: { index: 0, height: 0.5, translateY: -31.5 } },
    { offset: 400, expected: { index: 1, height: 48, translateY: 0 } },
    { offset: 625, expected: { index: 1, height: 25, translateY: -23 } },
    { offset: 650, expected: { index: 2, height: 40.5, translateY: 0 } },
    { offset: 1000, expected: { index: 2, height: 40.5, translateY: 0 } }
])('keeps the fade below the visible pinned row at offset $offset', ({ offset, expected }) =>
    Effect.sync(() => {
        expect(getScreenChromeStickyHeaderState(metrics, offset)).toEqual(expected);
    })
);

it.effect('leaves the original band unchanged without section headers', () =>
    Effect.sync(() => {
        expect(getScreenChromeStickyHeaderState([], 1000)).toEqual({ index: -1, height: 0, translateY: 0 });
    })
);
