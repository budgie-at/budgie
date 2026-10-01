import { CurrencyEnum, SettingsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';

import { seed } from './seed';

export const seedEuroBaseUahAccount = Effect.fnUntraced(function* () {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
    const account = yield* seed.account({ instrumentId: hryvnia.id });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

    return { euro, account };
});
