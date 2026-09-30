import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { runConsolidation } from './run-consolidation';

export const expectConsolidationResult = Effect.fnUntraced(function* (expected: { readonly consolidated: number; readonly found: number }) {
    expect(yield* runConsolidation()).toEqual(expected);
});
