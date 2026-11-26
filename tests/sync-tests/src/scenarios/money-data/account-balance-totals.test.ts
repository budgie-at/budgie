import {
    AccountBalanceRepository,
    AccountDebtTypeEnum,
    AccountEntityTable,
    AccountTypeEnum,
    CurrencyEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    PRECISION,
    SettingsEntityTable,
    SyncModeEnum,
    InstrumentTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { ExchangeRateRepository } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, seedDailyPrice, testDb, TestLayer } from '../../harness';

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const seedEntry = (accountId: number, units: number, createdAt: Date, deletedAt: Date | null = null) =>
    Effect.gen(function* () {
        const { id } = yield* seed.bankPairIncome(
            { externalId: `entry-${accountId}-${units}`, operatedAt: OPERATED_AT },
            { accountId, amount: units * PRECISION }
        );
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ createdAt, deletedAt })
            .where(eq(TransactionEntryEntityTable.transactionId, id));
    });

const seedStored = Effect.fnUntraced(function* (input: Parameters<typeof seed.account>[0], units: number) {
    const account = yield* seed.account(input);
    yield* seedEntry(account.id, units, OPERATED_AT);
    yield* (yield* AccountBalanceRepository).upsert({ accountId: account.id, amount: units * PRECISION });

    return account;
});

const seedMix = Effect.gen(function* () {
    const balances = yield* AccountBalanceRepository;
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const rated = yield* seed.instrument({ code: 'XRT', name: 'Rated' });
    const unrated = yield* seed.instrument({ code: 'XUN', name: 'Unrated' });
    const coin = yield* seed.instrument({ code: 'XCP', name: 'Priced coin', type: InstrumentTypeEnum.CRYPTO });
    const unpricedCoin = yield* seed.instrument({ code: 'XCU', name: 'Unpriced coin', type: InstrumentTypeEnum.CRYPTO });
    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    yield* (yield* ExchangeRateRepository).bulkUpsert([
        { baseInstrumentId: rated.id, quoteInstrumentId: euro.id, rate: 0.5, source: 'test' }
    ]);
    yield* seedDailyPrice(coin.id, euro.id, '2026-06-01', 10);

    const inEuro = { instrumentId: euro.id, type: AccountTypeEnum.CASH };
    const now = new Date();
    const later = new Date(now.getTime() + 3_600_000);

    yield* seedStored({ ...inEuro, title: 'default' }, 100);
    yield* seedStored({ title: 'rated', instrumentId: rated.id, type: AccountTypeEnum.BANK }, 200);
    yield* seedStored({ title: 'unrated', instrumentId: unrated.id, type: AccountTypeEnum.CASH }, 30);
    yield* seedStored({ title: 'coin', instrumentId: coin.id, type: AccountTypeEnum.CRYPTO }, 3);
    yield* seedStored({ title: 'unpriced coin', instrumentId: unpricedCoin.id, type: AccountTypeEnum.CRYPTO }, 5);
    yield* seed.account({ ...inEuro, title: 'zero' });

    const backward = yield* seed.account({ ...inEuro, title: 'backward', type: AccountTypeEnum.BANK_SYNC });
    yield* seedEntry(backward.id, 40, later);
    yield* seed.sync({ accountId: backward.id, mode: SyncModeEnum.BACKWARD, setupBalance: 777 * PRECISION });
    const forward = yield* seedStored({ ...inEuro, title: 'forward', type: AccountTypeEnum.BANK_SYNC }, 60);
    yield* seed.sync({ accountId: forward.id, mode: SyncModeEnum.FORWARD, setupBalance: 999 * PRECISION });

    const delta = yield* seedStored({ ...inEuro, title: 'delta', type: AccountTypeEnum.SAVINGS }, 50);
    yield* seedEntry(delta.id, 20, later);
    yield* seedEntry(delta.id, 600, later, now);
    const coinSync = yield* seed.account({ title: 'coin sync', instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });
    yield* balances.upsert({ accountId: coinSync.id, amount: 2 * PRECISION });
    yield* seedEntry(coinSync.id, 9, later);

    const lent = yield* seed.account({
        title: 'lent',
        instrumentId: rated.id,
        type: AccountTypeEnum.DEBT,
        targetBalance: 150 * PRECISION,
        targetBaseInstrumentId: euro.id,
        targetBaseAmount: 90 * PRECISION
    });
    const overpaid = yield* seed.account({
        ...inEuro,
        title: 'overpaid',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.BORROW,
        targetBalance: 40 * PRECISION
    });
    yield* balances.upsert({ accountId: lent.id, amount: 80 * PRECISION });
    const event = (debtAccountId: number, direction: DebtEventDirectionEnum, units: number) => ({
        debtAccountId,
        direction,
        source: DebtEventSourceEnum.MANUAL,
        amount: units * PRECISION
    });
    yield* testDb
        .insert(DebtEventEntityTable)
        .values([
            { ...event(lent.id, DebtEventDirectionEnum.OPEN, 100), baseAmount: 70 * PRECISION, baseInstrumentId: euro.id },
            { ...event(lent.id, DebtEventDirectionEnum.OPEN, 20), baseAmount: 999 * PRECISION, baseInstrumentId: rated.id },
            { ...event(lent.id, DebtEventDirectionEnum.OPEN, 500), deletedAt: now },
            event(lent.id, DebtEventDirectionEnum.CLOSE, 40),
            event(overpaid.id, DebtEventDirectionEnum.CLOSE, 50)
        ]);

    const deleted = yield* seedStored({ ...inEuro, title: 'deleted' }, 1000);
    yield* testDb.update(AccountEntityTable).set({ deletedAt: now }).where(eq(AccountEntityTable.id, deleted.id));
    yield* seedStored({ ...inEuro, title: 'inactive', isActive: false }, 11);
    yield* seedStored({ ...inEuro, title: 'excluded', includeInNetWorth: false }, 13);

    return { euro, delta };
});

describe('money-data/account-balance-totals', () => {
    it.effect('values every kind of account in the home rows and totals', () =>
        Effect.gen(function* () {
            const balances = yield* AccountBalanceRepository;
            const { euro, delta } = yield* seedMix;
            const rows = yield* balances.getHomeAccountRows(euro.id);
            const totalOfType = (type: AccountTypeEnum) =>
                balances.getTotalByAccountType(euro.id, type).pipe(Effect.map(([row]) => row.total / PRECISION));
            const liquidTotal = (isCryptoIncluded: boolean) =>
                balances.getLiquidTotal(euro.id, isCryptoIncluded).pipe(Effect.map(([row]) => row.total / PRECISION));

            expect(
                rows.map(row => [row.account.title, row.balance / PRECISION, row.convertedBalance / PRECISION, row.isValued])
            ).toStrictEqual([
                ['inactive', 11, 11, true],
                ['rated', 200, 100, true],
                ['backward', 777, 777, true],
                ['forward', 60, 60, true],
                ['default', 100, 100, true],
                ['zero', 0, 0, true],
                ['excluded', 13, 13, true],
                ['unrated', 30, 30, true],
                ['coin', 3, 30, true],
                ['unpriced coin', 5, 0, false],
                ['coin sync', 2, 20, true],
                ['overpaid', 0, 0, true],
                ['lent', 80, 40, true],
                ['delta', 70, 70, true]
            ]);
            expect(
                rows
                    .filter(row => row.account.type === AccountTypeEnum.DEBT)
                    .map(row => [
                        [row.debtTotalAmount, row.debtPaidAmount, row.debtOutstandingAmount, row.debtOverpaidAmount].map(
                            amount => amount / PRECISION
                        ),
                        [
                            row.convertedDebtTotalAmount,
                            row.convertedDebtPaidAmount,
                            row.convertedDebtOutstandingAmount,
                            row.convertedDebtOverpaidAmount
                        ].map(amount => amount / PRECISION),
                        row.convertedTargetBalance / PRECISION,
                        row.debtProgressPercentage
                    ])
            ).toStrictEqual([
                [[40, 50, 0, 10], [40, 50, 0, 10], 40, 100],
                [[120, 40, 80, 0], [80, 20, 60, 0], 90, 33.33]
            ]);
            expect(yield* balances.getNetWorth(euro.id)).toEqual([{ netWorth: 1238 * PRECISION }]);
            expect(yield* balances.getAssetClassTotals(euro.id)).toEqual([
                { fiatTotal: 1188 * PRECISION, cryptoTotal: 50 * PRECISION, fiatCount: 10, cryptoCount: 3 }
            ]);
            expect([yield* liquidTotal(false), yield* liquidTotal(true)]).toStrictEqual([1080, 1130]);
            expect(
                yield* Effect.forEach(
                    [
                        AccountTypeEnum.CASH,
                        AccountTypeEnum.BANK,
                        AccountTypeEnum.BANK_SYNC,
                        AccountTypeEnum.SAVINGS,
                        AccountTypeEnum.CRYPTO,
                        AccountTypeEnum.CRYPTO_SYNC,
                        AccountTypeEnum.DEBT
                    ],
                    totalOfType
                )
            ).toStrictEqual([143, 100, 837, 70, 30, 20, 40]);

            yield* (yield* AccountBalanceIncrementalService).updateBalancesByAccountIds([delta.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
