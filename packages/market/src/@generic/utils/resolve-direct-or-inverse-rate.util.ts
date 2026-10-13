import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { HistoricalExchangeRateEntityInterface } from '@budgie/contracts';

export const resolveDirectOrInverseRate = <E, R>(
    lookup: (
        sourceInstrumentId: number,
        targetInstrumentId: number
    ) => Effect.Effect<Pick<HistoricalExchangeRateEntityInterface, 'rate'> | undefined, E, R>,
    sourceInstrumentId: number,
    targetInstrumentId: number
): Effect.Effect<number | null, E, R> =>
    Effect.gen(function* () {
        const direct = yield* lookup(sourceInstrumentId, targetInstrumentId);

        if (isDefined(direct)) {
            return direct.rate;
        }

        const inverse = yield* lookup(targetInstrumentId, sourceInstrumentId);

        return isDefined(inverse) ? 1 / inverse.rate : null;
    });
