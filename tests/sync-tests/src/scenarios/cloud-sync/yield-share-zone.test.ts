import { TestSeedService } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { AccountTypeEnum, SyncZoneRoleEnum, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { describe, expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    countRows,
    expectNoRejections,
    onShareDevice,
    OPERATED_AT,
    pullHousehold,
    queryRows,
    refreshAllBalances,
    shareAndUpload,
    shareDevices,
    startHousehold,
    testDb,
    uploadDevice
} from '../../harness';

import type { DB } from '@budgie/contracts';

const MEMBER_DEVICE = 'member-device';

const seedSourcedInterest = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });
    const deposit = yield* seed.account({ title: 'Deposit', type: AccountTypeEnum.DEPOSIT });
    const interest = yield* seed.manualExpense({
        accountId: joint.id,
        amount: 1_000_000,
        operatedAt: OPERATED_AT,
        title: 'Interest',
        type: TransactionTypeEnum.INCOME
    });

    yield* testDb.$client.unsafe(`UPDATE transactions SET yield_kind = ?, yield_source_account_id = ? WHERE id = ?`, [
        YieldKindEnum.INTEREST,
        deposit.id,
        interest.id
    ]);
    yield* refreshAllBalances(testDb);

    return { joint, deposit };
});

const shareOnOwner = (accountIds: readonly number[]) =>
    onShareDevice(
        testDb,
        Effect.flatMap(HouseholdShareService, service => service.shareAccounts(accountIds))
    );

const unshareOnOwner = (accountId: number) =>
    onShareDevice(
        testDb,
        Effect.flatMap(HouseholdShareService, service => service.unshareAccount(accountId))
    );

const startSharedPair = Effect.gen(function* () {
    const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
    const { joint, deposit } = yield* seedSourcedInterest;

    yield* uploadDevice(testDb, clouds);
    yield* shareOnOwner([joint.id, deposit.id]);
    yield* uploadDevice(testDb, clouds);
    expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));

    return { deviceB, clouds, deposit };
});

const sourceOf = (database: DB) =>
    queryRows(
        database,
        `SELECT t.yield_kind AS yieldKind, a.title AS sourceTitle FROM transactions t
        LEFT JOIN accounts a ON a.id = t.yield_source_account_id WHERE t.title = 'Interest'`
    );

describe('cloud-sync/yield-share-zone', () => {
    shareDevices('two devices', it => {
        it.effect('nulls the source of income whose position stays in another zone, and uploads the null', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { joint } = yield* seedSourcedInterest;

                yield* uploadDevice(testDb, clouds);
                yield* shareAndUpload(testDb, clouds, joint.id);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
                expect(yield* sourceOf(testDb)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
                expect(yield* sourceOf(deviceB)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
                expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);
            })
        );

        it.effect('nulls the source of income that stays when its position is shared away', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { deposit } = yield* seedSourcedInterest;

                yield* uploadDevice(testDb, clouds);
                yield* shareAndUpload(testDb, clouds, deposit.id);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
                expect(yield* sourceOf(testDb)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
            })
        );

        it.effect('queues the cleared source in the owner outbox', () =>
            Effect.gen(function* () {
                yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { joint } = yield* seedSourcedInterest;

                yield* shareOnOwner([joint.id]);

                expect(
                    yield* countRows(
                        testDb,
                        `sync_outbox WHERE record_type = 'Transaction' AND operation = 'SAVE' AND changed_columns LIKE '%yield_source_account_id%'`
                    )
                ).toBe(1);
            })
        );

        it.effect('clears a source that was soft-deleted before the share', () =>
            Effect.gen(function* () {
                yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { joint, deposit } = yield* seedSourcedInterest;

                yield* testDb.$client.unsafe(`UPDATE accounts SET deleted_at = ? WHERE id = ?`, [Date.now(), deposit.id]);
                yield* shareOnOwner([joint.id]);

                expect(yield* sourceOf(testDb)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
            })
        );

        it.effect('clears the source when unsharing splits the income from its position, and wins over an older local edit', () =>
            Effect.gen(function* () {
                const { deviceB, clouds, deposit } = yield* startSharedPair;
                yield* deviceB.$client.unsafe(
                    `UPDATE transactions SET title = 'Interest', comment = 'edited on B' WHERE title = 'Interest'`
                );

                yield* unshareOnOwner(deposit.id);
                yield* uploadDevice(testDb, clouds);

                expect(yield* sourceOf(testDb)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
                expectNoRejections(yield* pullHousehold(deviceB, clouds, MEMBER_DEVICE));
                expect(yield* sourceOf(deviceB)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: null }]);
                expect(yield* queryRows(deviceB, `SELECT comment FROM transactions WHERE title = 'Interest'`)).toEqual([
                    { comment: 'edited on B' }
                ]);
            })
        );

        it.effect('keeps the link when the position and its income move together', () =>
            Effect.gen(function* () {
                const { deviceB } = yield* startSharedPair;

                expect(yield* sourceOf(deviceB)).toEqual([{ yieldKind: YieldKindEnum.INTEREST, sourceTitle: 'Deposit' }]);
            })
        );
    });
});
