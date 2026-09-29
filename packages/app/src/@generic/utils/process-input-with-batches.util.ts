import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { microPause } from './micro-pause.util';

export const processInputWithBatches = Effect.fnUntraced(function* <T, O, E, R>(
    inputs: T[],
    batchSize: number,
    cb: (batch: T[]) => Effect.Effect<O[] | null, E, R>
) {
    if (!Number.isInteger(batchSize) || !isPositiveNumber(batchSize)) {
        return yield* Effect.die(new RangeError());
    }

    const results: O[] = [];

    for (let index = 0; index < inputs.length; index += batchSize) {
        const batchResults = yield* cb(inputs.slice(index, index + batchSize));

        if (isDefined(batchResults)) {
            results.push(...batchResults);
        }

        if (index + batchSize < inputs.length) {
            yield* Effect.promise(() => microPause());
        }
    }

    return results;
});
