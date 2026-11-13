import { AccountTypeEnum, CurrencyEnum, InstrumentTypeEnum, PRECISION, TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrumentByCode, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const seedAccounts = Effect.fnUntraced(function* () {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const hryvnia = yield* requireInstrumentByCode(CurrencyEnum.UAH);
    const coin = yield* testSeedService.instrument({ code: 'TRV1', name: 'TRV1', symbol: 'TRV1', type: InstrumentTypeEnum.CRYPTO });
    const cryptoAccount = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });
    const bankAccount = yield* testSeedService.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.BANK });

    yield* setDefaultInstrument(euro.id);

    return { euro, coin, cryptoAccount, bankAccount };
});

const pendingIncome = (accountId: number, operatedAt: string) =>
    testSeedService.valuedIncome({
        accountId,
        amount: PRECISION,
        operatedAt: new Date(operatedAt),
        title: 'Reward',
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null
    });

describe('market-priced entry queries', () => {
    it.effect('leaves market-priced accounts out of the fiat buckets', () =>
        Effect.gen(function* () {
            const repository = yield* TransactionEntryBaseValuationRepository;
            const { euro, coin, cryptoAccount, bankAccount } = yield* seedAccounts();

            yield* pendingIncome(cryptoAccount.id, '2026-03-10T12:00:00.000Z');
            yield* pendingIncome(bankAccount.id, '2026-03-10T12:00:00.000Z');

            const buckets = yield* repository.findPendingBaseValuationBuckets(euro.id);

            expect(buckets.map(bucket => bucket.sourceInstrumentId)).not.toContain(coin.id);
            expect(buckets).toHaveLength(1);
            expect(yield* repository.countPendingBaseValuationEntries(euro.id)).toBe(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pages market-priced entries by UTC day and writes base values per row', () =>
        Effect.gen(function* () {
            const repository = yield* TransactionEntryBaseValuationRepository;
            const { euro, coin, cryptoAccount } = yield* seedAccounts();
            const inside = yield* pendingIncome(cryptoAccount.id, '2026-03-10T23:30:00.000Z');

            yield* pendingIncome(cryptoAccount.id, '2026-03-11T00:30:00.000Z');

            const page = yield* repository.findMarketPricedEntriesInRange({
                instrumentId: coin.id,
                fromDate: '2026-03-10',
                toDate: '2026-03-10',
                afterId: 0,
                limit: 10
            });

            expect(page.map(row => row.id)).toStrictEqual([inside.entry.id]);
            expect(page[0]?.operatedAt).toStrictEqual(new Date('2026-03-10T23:30:00.000Z'));

            yield* repository.updateEntryBaseValuations([
                { id: inside.entry.id, baseInstrumentId: euro.id, baseExchangeRate: null, baseAmount: 7 * PRECISION }
            ]);

            const [updated] = yield* repository.findMarketPricedEntriesInRange({
                instrumentId: coin.id,
                fromDate: '2026-03-10',
                toDate: '2026-03-10',
                afterId: 0,
                limit: 10
            });

            expect(updated).toMatchObject({ baseInstrumentId: euro.id, baseExchangeRate: null, baseAmount: 7 * PRECISION });
            expect(yield* repository.findOldestMarketPricedEntryDate(coin.id)).toBe('2026-03-10');
            expect(yield* repository.findMarketPricedInstrumentIds).toStrictEqual([coin.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
