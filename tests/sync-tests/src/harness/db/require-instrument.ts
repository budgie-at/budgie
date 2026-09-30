import { instrumentRepository } from '@app/@generic/drizzle/db/db';
import { CurrencyEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const requireInstrument = Effect.fnUntraced(function* (code: CurrencyEnum) {
    const instrument = yield* instrumentRepository.findByCode(code);

    if (!isDefined(instrument)) {
        return yield* Effect.die(new Error(`Instrument ${code} not found`));
    }

    return instrument;
});
