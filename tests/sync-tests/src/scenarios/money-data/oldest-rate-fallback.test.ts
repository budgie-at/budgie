import { EntryBaseValuationService } from '@app/money-data/service/entry-base-valuation.service';
import { CurrencyEnum, PRECISION, SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, TestLayer } from '../../harness';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

describe('valuation oldest-rate fallback', () => {
    it.effect('values a transaction older than the seeded range using the oldest available historical rate', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const account = seed.account({ instrumentId: hryvnia.id });

            testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id }).run();

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 50 * PRECISION,
                operatedAt: new Date('2009-01-01T12:00:00.000Z'),
                externalSource: null
            });

            expect(valuation).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 0.0889028367561666,
                baseAmount: 4_445_142
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
