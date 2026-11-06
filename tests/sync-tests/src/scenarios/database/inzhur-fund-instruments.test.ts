import { Db, InstrumentPriceProviderEnum, InstrumentRepository, TransactionEntityTable, InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, seed, TestLayer } from '../../harness';

const SEEDED_FUNDS = [
    { code: 'UA5000014044', name: 'Inzhur REIT' },
    { code: 'UA5000012246', name: 'Inzhur Energy' }
];

describe('database/inzhur-fund-instruments', () => {
    it.effect.each(SEEDED_FUNDS)('seeds $name as an INZHUR-priced FUND instrument keyed by ISIN', ({ code, name }) =>
        Effect.gen(function* () {
            const instrumentRepository = yield* InstrumentRepository;
            const instrument = yield* instrumentRepository.findByCode(code);

            expect(instrument).toMatchObject({
                type: InstrumentTypeEnum.FUND,
                code,
                name,
                priceProvider: InstrumentPriceProviderEnum.INZHUR,
                providerInstrumentId: code
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lists the seeded funds through the price-provider finder', () =>
        Effect.gen(function* () {
            const instrumentRepository = yield* InstrumentRepository;
            const funds = yield* instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
                InstrumentTypeEnum.FUND,
                InstrumentPriceProviderEnum.INZHUR
            );

            expect(funds.map(fund => fund.code).sort()).toEqual(SEEDED_FUNDS.map(fund => fund.code).sort());
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('uses the fund-account index for a linked-fund transaction lookup', () =>
        Effect.gen(function* () {
            const account = yield* seed.account();
            const plan = yield* explainQueryPlan(
                Db.query(database =>
                    database.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.fundAccountId, account.id))
                )
            );

            expect(plan.join('\n')).toContain('transactions_fund_account_idx');
        }).pipe(Effect.provide(TestLayer))
    );
});
