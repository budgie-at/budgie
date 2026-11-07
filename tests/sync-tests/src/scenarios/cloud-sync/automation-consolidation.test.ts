import { makeTestDbLayer, resetTestDb, TestSeedService } from '@budgie-at/test-kit';
import { Db, deriveConsolidationSyncId, ExternalSourceEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport, testDb } from '../../harness';

import { expectBalancesMatchLedger, pullDevice, pushDevice, readOutboxRows, refreshAllBalances } from './apply-harness';
import { reapplyAutomation, settleDevices, syncIdsOf } from './automation-harness';

import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const BANK_OPERATED_AT = new Date('2026-10-02T10:01:00Z');
const AMOUNT = 10_000_000;

interface VisibleTransactionInterface {
    readonly syncId: string;
    readonly consolidationType: string | null;
    readonly entryCount: number;
}

const visibleTransactions = (database: DB) =>
    database.$client.unsafe<VisibleTransactionInterface>(
        `SELECT t.sync_id AS syncId, t.consolidation_type AS consolidationType,
            (SELECT COUNT(*) FROM transaction_entries e WHERE e.transaction_id = t.id AND e.deleted_at IS NULL) AS entryCount
        FROM transactions t WHERE t.deleted_at IS NULL AND t.consolidation_parent_transaction_id IS NULL ORDER BY t.sync_id`
    );

const accountIdOf = (database: DB) =>
    database.$client.unsafe<{ readonly id: number }>(`SELECT id FROM accounts LIMIT 1`).pipe(Effect.map(([account]) => account.id));

const accountIdByExternalId = (database: DB, externalId: string) =>
    database.$client
        .unsafe<{ readonly id: number }>(`SELECT id FROM accounts WHERE external_id = ?`, [externalId])
        .pipe(Effect.map(([account]) => account.id));

const transferMccIdOf = (database: DB) =>
    database.$client
        .unsafe<{ readonly id: number }>(`SELECT id FROM mcc_categories WHERE mcc = '4829'`)
        .pipe(Effect.map(([mccCategory]) => mccCategory.id));

const sourceSyncIdsOf = (database: DB) =>
    database.$client
        .unsafe<{ readonly syncId: string }>(
            `SELECT sync_id AS syncId FROM transactions WHERE consolidation_parent_transaction_id IS NOT NULL ORDER BY sync_id`
        )
        .pipe(Effect.map(rows => rows.map(({ syncId }) => syncId)));

describe('cloud-sync/automation-consolidation', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('consolidates a manual entry and the same bank import that cross in transit into one transaction on both devices', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const seedA = new TestSeedService(testDb);
                const seedB = new TestSeedService(deviceB);
                const account = yield* seedA.bankSyncAccount('Mono', ExternalSourceEnum.MONOBANK, null);

                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, 'device-b');
                yield* pullDevice(testDb, cloud, 'device-a');

                yield* seedA.manualExpense({
                    accountId: account.id,
                    amount: AMOUNT,
                    operatedAt: OPERATED_AT,
                    title: 'Cafe',
                    externalSource: ExternalSourceEnum.RECEIPT
                });
                yield* seedB.bankPairExpense(
                    { externalId: 'bank-1', operatedAt: BANK_OPERATED_AT },
                    { accountId: yield* accountIdOf(deviceB), amount: AMOUNT }
                );
                yield* refreshAllBalances(testDb);
                yield* refreshAllBalances(deviceB);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);
                const onA = yield* visibleTransactions(testDb);
                const onB = yield* visibleTransactions(deviceB);

                expect(rounds).toBeLessThanOrEqual(4);
                expect(onA).toHaveLength(1);
                expect(onB).toHaveLength(1);
                expect(onA[0].syncId).toBe(onB[0].syncId);
                expect(onA[0].consolidationType).toBe(TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE);
                expect(onB[0].consolidationType).toBe(TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE);
                expect(onA[0].entryCount).toBe(onB[0].entryCount);
                yield* expectBalancesMatchLedger(testDb);
                yield* expectBalancesMatchLedger(deviceB);

                yield* reapplyAutomation(testDb, yield* syncIdsOf(testDb, 'transactions'));
                yield* reapplyAutomation(deviceB, yield* syncIdsOf(deviceB, 'transactions'));

                expect(yield* readOutboxRows(testDb)).toEqual([]);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );

        it.effect('consolidates a transfer pair whose legs were created on different devices into one canonical with a shared id', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const seedA = new TestSeedService(testDb);
                const seedB = new TestSeedService(deviceB);

                yield* seedA.accountPair('UA-FROM', 'UA-TO');
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, 'device-b');
                yield* pullDevice(testDb, cloud, 'device-a');

                yield* seedA.bankPairExpense(
                    { externalId: 'tx-expense', operatedAt: OPERATED_AT },
                    {
                        accountId: yield* accountIdByExternalId(testDb, 'mono-from'),
                        amount: AMOUNT,
                        mccCategoryId: yield* transferMccIdOf(testDb),
                        toIban: 'UA-TO'
                    }
                );
                yield* seedB.bankPairIncome(
                    { externalId: 'tx-income', operatedAt: BANK_OPERATED_AT },
                    {
                        accountId: yield* accountIdByExternalId(deviceB, 'mono-to'),
                        amount: AMOUNT,
                        mccCategoryId: yield* transferMccIdOf(deviceB)
                    }
                );
                yield* refreshAllBalances(testDb);
                yield* refreshAllBalances(deviceB);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);
                const onA = yield* visibleTransactions(testDb);
                const onB = yield* visibleTransactions(deviceB);
                const sourcesOnA = yield* sourceSyncIdsOf(testDb);

                expect(rounds).toBeLessThanOrEqual(4);
                expect(onA).toHaveLength(1);
                expect(onB).toHaveLength(1);
                expect(onA[0].syncId).toBe(onB[0].syncId);
                expect(onA[0].syncId).toBe(deriveConsolidationSyncId(sourcesOnA));
                expect(yield* sourceSyncIdsOf(deviceB)).toEqual(sourcesOnA);
                expect(onA[0].entryCount).toBe(onB[0].entryCount);
                yield* expectBalancesMatchLedger(testDb);
                yield* expectBalancesMatchLedger(deviceB);
                expect(yield* readOutboxRows(testDb)).toEqual([]);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );
    });
});
