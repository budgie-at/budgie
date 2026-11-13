import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    HOUSEHOLD_SYNC_ZONE,
    INVESTMENTS_CATEGORY_ID,
    SettingsRepository,
    SyncApplyStateRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionRepository,
    TransactionYieldRepository,
    TransactionTypeEnum,
    TransactionUpdatedByEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE, YieldTagRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { readOutboxRows, seed, testDb, TestLayer } from '../../harness';

const OPERATED_AT = new Date('2026-06-01T08:00:00.000Z');

const seedIncome = (
    accountId: number,
    input: { readonly externalId?: string; readonly externalSource?: ExternalSourceEnum; readonly title?: string }
) => seed.manualExpense({ accountId, amount: 1_000_000, operatedAt: OPERATED_AT, type: TransactionTypeEnum.INCOME, ...input });

const readTag = (transactionId: number) =>
    Effect.gen(function* () {
        const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transactionId));
        const [entry] = yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, transactionId));

        return {
            yieldKind: transaction.yieldKind,
            yieldSourceAccountId: transaction.yieldSourceAccountId,
            updatedAt: transaction.updatedAt,
            categoryId: entry.categoryId
        };
    });

const setFields = (transactionId: number, fields: Partial<typeof TransactionEntityTable.$inferInsert>) =>
    testDb.update(TransactionEntityTable).set(fields).where(eq(TransactionEntityTable.id, transactionId));

const clearOutbox = testDb.$client.unsafe('DELETE FROM sync_outbox');

const repair = Effect.flatMap(YieldTagRepairService, service => service.runOnce()).pipe(Effect.provide(YieldTagRepairService.layer));

const failingRepairLayer = Layer.mergeAll(
    SettingsRepository.layer,
    SyncApplyStateRepository.layer,
    Layer.effect(
        TransactionYieldRepository,
        Effect.map(TransactionYieldRepository.make, repository => ({ ...repository, fillYieldTags: () => Effect.die('interrupted') }))
    )
);

const failingRepair = Effect.flatMap(YieldTagRepairService.make, service => service.runOnce()).pipe(
    Effect.provide(failingRepairLayer),
    Effect.exit
);

const seedProviders = Effect.gen(function* () {
    const binance = yield* seed.account({ title: 'BNB', type: AccountTypeEnum.CRYPTO_SYNC, externalSource: ExternalSourceEnum.BINANCE });
    const cash = yield* seed.account({ title: 'Inzhur cash', type: AccountTypeEnum.CASH, externalSource: ExternalSourceEnum.INZHUR });
    const fund = yield* seed.account({ title: 'REIT', type: AccountTypeEnum.STOCKS, externalSource: ExternalSourceEnum.INZHUR });
    const earn = yield* seedIncome(binance.id, { externalId: 'binance:earn:BNB:2026-06-01', externalSource: ExternalSourceEnum.BINANCE });
    const locked = yield* seedIncome(binance.id, {
        externalId: 'binance:earn-locked:BNB:2026-06-01',
        externalSource: ExternalSourceEnum.BINANCE
    });
    const staking = yield* seedIncome(binance.id, {
        externalId: 'binance:eth-staking:BETH:2026-06-01',
        externalSource: ExternalSourceEnum.BINANCE
    });
    const distribution = yield* seedIncome(binance.id, { externalId: 'binance:dividend:77', externalSource: ExternalSourceEnum.BINANCE });
    const dividend = yield* seedIncome(cash.id, { externalId: 'inzhur:op:1', externalSource: ExternalSourceEnum.INZHUR });
    const tax = yield* seed.manualExpense({
        accountId: cash.id,
        amount: 180_000,
        operatedAt: OPERATED_AT,
        externalId: 'inzhur:op:2',
        externalSource: ExternalSourceEnum.INZHUR
    });
    const unattributed = yield* seedIncome(cash.id, { title: INZHUR_UNATTRIBUTED_DIVIDEND_TITLE });

    yield* setFields(dividend.id, { fundAccountId: fund.id });
    yield* setFields(tax.id, { fundAccountId: fund.id });
    yield* clearOutbox;

    return { binance, fund, earn, locked, staking, distribution, dividend, tax, unattributed };
});

describe('sync/yield-tag-repair', () => {
    it.effect('derives every provider tag locally, once, without touching the outbox or updated_at', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;
            const before = yield* readTag(rows.earn.id);

            yield* repair;

            expect(yield* readTag(rows.earn.id)).toMatchObject({
                yieldKind: YieldKindEnum.EARN,
                categoryId: INVESTMENTS_CATEGORY_ID,
                updatedAt: before.updatedAt
            });
            expect((yield* readTag(rows.locked.id)).yieldKind).toBe(YieldKindEnum.EARN);
            expect((yield* readTag(rows.staking.id)).yieldKind).toBe(YieldKindEnum.STAKING);
            expect((yield* readTag(rows.distribution.id)).yieldKind).toBe(YieldKindEnum.DISTRIBUTION);
            expect(yield* readTag(rows.dividend.id)).toMatchObject({
                yieldKind: YieldKindEnum.DIVIDEND,
                yieldSourceAccountId: rows.fund.id
            });
            expect(yield* readTag(rows.tax.id)).toMatchObject({ yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: rows.fund.id });
            expect(yield* readTag(rows.unattributed.id)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: null });
            expect(yield* readOutboxRows(testDb)).toEqual([]);
            expect((yield* (yield* SettingsRepository).getSettings()).yieldTagRepairVersion).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('tags user-edited rows, skips NONE, and runs only once per device', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;

            yield* setFields(rows.earn.id, { updatedBy: TransactionUpdatedByEnum.USER });
            yield* setFields(rows.distribution.id, { yieldKind: YieldKindEnum.NONE });
            yield* repair;

            expect((yield* readTag(rows.earn.id)).yieldKind).toBe(YieldKindEnum.EARN);
            expect((yield* readTag(rows.distribution.id)).yieldKind).toBe(YieldKindEnum.NONE);

            yield* setFields(rows.staking.id, { yieldKind: null });
            yield* repair;

            expect((yield* readTag(rows.staking.id)).yieldKind).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a user edit after the repair is captured by the outbox', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;

            yield* repair;
            yield* (yield* TransactionRepository).updateById(rows.earn.id, { title: 'Renamed' });

            expect((yield* readOutboxRows(testDb)).map(row => row.recordType)).toEqual(['Transaction']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairBySyncIds checks only the ids it receives and is idempotent', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;
            const repairService = yield* YieldTagRepairService;
            const earnSyncId = (yield* (yield* TransactionRepository).getByIdRaw(rows.earn.id))?.syncId ?? '';

            yield* repairService.repairBySyncIds([earnSyncId]);
            yield* repairService.repairBySyncIds([earnSyncId]);

            expect((yield* readTag(rows.earn.id)).yieldKind).toBe(YieldKindEnum.EARN);
            expect((yield* readTag(rows.staking.id)).yieldKind).toBeNull();
            expect(yield* readOutboxRows(testDb)).toEqual([]);
        }).pipe(Effect.provide([TestLayer, YieldTagRepairService.layer]))
    );

    it.effect('tags only income for Binance prefixes and leaves expenses and transfers untagged', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;
            const binanceExpense = yield* seed.manualExpense({
                accountId: rows.binance.id,
                amount: 500_000,
                operatedAt: OPERATED_AT,
                externalId: 'binance:earn:BNB:2026-06-02',
                externalSource: ExternalSourceEnum.BINANCE
            });
            const transfer = yield* seedIncome(rows.binance.id, { externalId: 'binance:earn:BNB:2026-06-03' });

            yield* setFields(transfer.id, { type: TransactionTypeEnum.TRANSFER });
            yield* repair;

            expect(yield* readTag(binanceExpense.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
            expect(yield* readTag(transfer.id)).toMatchObject({ yieldKind: null, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('gives a null source when the fund lives in another zone', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;

            yield* testDb.update(AccountEntityTable).set({ syncZone: HOUSEHOLD_SYNC_ZONE }).where(eq(AccountEntityTable.id, rows.fund.id));
            yield* repair;

            expect(yield* readTag(rows.dividend.id)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps updated_at and updated_by of repaired rows', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;

            yield* setFields(rows.dividend.id, {
                updatedBy: TransactionUpdatedByEnum.USER,
                updatedAt: new Date('2026-01-01T00:00:00.000Z')
            });
            const [before] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, rows.dividend.id));

            yield* repair;

            const [after] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, rows.dividend.id));

            expect(after).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, updatedBy: before.updatedBy, updatedAt: before.updatedAt });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('completes a partially tagged state on the next run and sets the version only at the end', () =>
        Effect.gen(function* () {
            const rows = yield* seedProviders;

            yield* setFields(rows.earn.id, { yieldKind: YieldKindEnum.EARN });

            expect((yield* failingRepair)._tag).toBe('Failure');
            expect((yield* (yield* SettingsRepository).getSettings()).yieldTagRepairVersion).toBe(0);
            expect((yield* readTag(rows.staking.id)).yieldKind).toBeNull();

            yield* repair;

            expect((yield* readTag(rows.earn.id)).yieldKind).toBe(YieldKindEnum.EARN);
            expect((yield* readTag(rows.staking.id)).yieldKind).toBe(YieldKindEnum.STAKING);
            expect((yield* readTag(rows.dividend.id)).yieldKind).toBe(YieldKindEnum.DIVIDEND);
            expect((yield* (yield* SettingsRepository).getSettings()).yieldTagRepairVersion).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
