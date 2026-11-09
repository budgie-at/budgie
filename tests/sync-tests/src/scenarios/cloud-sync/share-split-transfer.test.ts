import { TestSeedService } from '@budgie-at/test-kit';
import { ICloudParticipantRole, ICloudSyncScope, SyncApplyService } from '@budgie/cloud-sync';
import { HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, Db, SyncZoneRoleEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { describe, expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    testDb,
    makeSyncServiceContext,
    matchZoneLineage,
    participantsFor,
    syncService,
    reconfigureAndAcknowledgeMeta,
    flattenBatches,
    sentEvent,
    savedFrom,
    refreshAllBalances,
    uploadDevice,
    countRows,
    pullZones,
    queryRows,
    shareDevices,
    expectLedgers,
    expectNoRejections,
    pullHousehold,
    shareAndUpload,
    startHousehold
} from '../../harness';

const OPERATED_AT = new Date('2026-10-06T10:00:00Z');
const SHARED_AMOUNT = 7_654_321;
const PRIVATE_AMOUNT = 3_141_592;
const PRIVATE_STRINGS = ['Savings', 'secret-plan', 'private memo', 'UA-PRIVATE-IBAN', `${PRIVATE_AMOUNT}`, 'Top up savings'];

const seedSharedToPrivateTransfer = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });
    const savings = yield* seed.account({ title: 'Savings' });
    const secretTag = yield* seed.tag('secret-plan');
    const transfer = yield* seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId: joint.id,
        sourceAmount: SHARED_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: savings.id,
        targetAmount: PRIVATE_AMOUNT,
        toIban: 'UA-PRIVATE-IBAN',
        title: 'Top up savings'
    });

    yield* testDb.$client.unsafe(`UPDATE transactions SET comment = 'private memo' WHERE id = ?`, [transfer.id]);
    yield* seed.transactionTag(transfer.id, secretTag.id);
    yield* seed.manualExpense({ accountId: savings.id, amount: 400_000, operatedAt: OPERATED_AT, title: 'Savings fee' });
    yield* refreshAllBalances(testDb);

    return { joint, savings, transfer };
});

const startSharedTransfer = (memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        const { deviceB, clouds } = yield* startHousehold(memberRole);
        const { joint } = yield* seedSharedToPrivateTransfer;

        yield* uploadDevice(testDb, clouds);
        yield* shareAndUpload(testDb, clouds, joint.id);

        return { deviceB, clouds };
    });

const startOwnerLegDeletion = Effect.gen(function* () {
    const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);
    const [leg] = yield* queryRows<{ readonly syncId: string }>(
        testDb,
        "SELECT sync_id AS syncId FROM sync_record WHERE record_type = 'TransactionLeg'"
    );

    clouds.household.remove('TransactionLeg', HOUSEHOLD_SYNC_ZONE, leg.syncId);
    yield* testDb.$client.unsafe('UPDATE sync_zone_registry SET role = ?, database_scope = ? WHERE zone_label = ?', [
        SyncZoneRoleEnum.PARTICIPANT,
        ICloudSyncScope.SHARED,
        HOUSEHOLD_SYNC_ZONE
    ]);

    return { deviceB, clouds, leg };
});

describe('cloud-sync/share-split-transfer', () => {
    shareDevices('two devices', it => {
        it.effect('keeps another member transfer leg when deletion is requested', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);
                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'member-delete'));
                const [transaction] = yield* queryRows<{ readonly id: number }>(deviceB, 'SELECT id FROM transactions');
                yield* Effect.flatMap(TransactionService, service => service.deleteById(transaction.id)).pipe(
                    Effect.provide(TransactionService.layer),
                    Effect.provideService(Db, deviceB)
                );
                expect(yield* countRows(deviceB, 'transactions')).toBe(1);
                expect(yield* queryRows(deviceB, 'SELECT amount FROM transaction_entries')).toEqual([{ amount: SHARED_AMOUNT }]);
            })
        );

        it.effect('uses the current participant display name for a private side', () =>
            Effect.gen(function* () {
                yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);
                const context = makeSyncServiceContext(testDb);
                context.transport.behavior.participants = participantsFor(ICloudParticipantRole.OWNER).map(participant => ({
                    ...participant,
                    isCurrentUser: true
                }));
                yield* context.run(
                    Effect.gen(function* () {
                        yield* testDb.$client.unsafe(
                            "UPDATE transactions SET comment = 'owner name refresh' WHERE title = 'Top up savings'"
                        );
                        const service = yield* syncService;
                        yield* reconfigureAndAcknowledgeMeta(context, service);
                        const legs = flattenBatches(context.transport.calls.savedBatches).filter(
                            record => record.recordType === 'TransactionLeg'
                        );
                        expect(legs).toHaveLength(1);
                        expect(legs[0].encryptedFields['privateOwnerName']).toBe('Owner Person');
                        yield* service.handleSentChanges(
                            sentEvent({ savedRecords: savedFrom(flattenBatches(context.transport.calls.savedBatches), 'saved') })
                        );
                        context.transport.behavior.isParticipantLookupFailing = true;
                        yield* service.reconfigure;
                        yield* testDb.$client.unsafe("UPDATE transactions SET comment = 'offline edit' WHERE title = 'Top up savings'");
                        yield* service.drain;
                        const resentLegs = flattenBatches(context.transport.calls.savedBatches).filter(
                            record => record.recordType === 'TransactionLeg'
                        );
                        expect(resentLegs).toHaveLength(2);
                        expect(resentLegs[1].encryptedFields['privateOwnerName']).toBe('Owner Person');
                    })
                );
            })
        );
        it.effect('does not resurrect owner deletions arriving in separate fetch batches', () =>
            Effect.gen(function* () {
                const { clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);
                const [leg] = yield* queryRows<{ readonly syncId: string }>(
                    testDb,
                    "SELECT sync_id AS syncId FROM sync_record WHERE record_type = 'TransactionLeg'"
                );
                const [home] = yield* queryRows<{ readonly syncId: string }>(
                    testDb,
                    "SELECT sync_id AS syncId FROM transactions WHERE title = 'Top up savings'"
                );
                clouds.household.remove('TransactionLeg', HOUSEHOLD_SYNC_ZONE, leg.syncId);
                clouds.personal.remove('Transaction', PERSONAL_SYNC_ZONE, home.syncId);
                yield* makeSyncServiceContext(testDb).run(
                    Effect.gen(function* () {
                        const apply = yield* SyncApplyService;
                        const result = yield* apply.apply({
                            records: [],
                            deletions: [{ recordType: 'TransactionLeg', recordName: leg.syncId, zone: HOUSEHOLD_SYNC_ZONE }]
                        });
                        yield* uploadDevice(testDb, clouds);
                        expect(clouds.household.inventory(HOUSEHOLD_SYNC_ZONE).has(leg.syncId)).toBe(false);
                        yield* apply.apply({
                            records: [],
                            deletions: [{ recordType: 'Transaction', recordName: home.syncId, zone: PERSONAL_SYNC_ZONE }]
                        });
                        yield* apply.enqueueOwnerTransfers(result.ownerTransferRetries);
                        yield* uploadDevice(testDb, clouds);
                        expect(clouds.personal.inventory(PERSONAL_SYNC_ZONE).has(home.syncId)).toBe(false);
                    })
                );
            })
        );
        it.effect('replays a fetched owner leg deletion after a kill before did-fetch', () =>
            Effect.gen(function* () {
                const { deviceB, clouds, leg } = yield* startOwnerLegDeletion;
                expect(clouds.household.inventory(HOUSEHOLD_SYNC_ZONE).has(leg.syncId)).toBe(false);
                const context = makeSyncServiceContext(testDb);
                context.store.holder.state = { ...context.store.holder.state, sharedStateSerialization: 'before-deletion' };
                const deletion = {
                    scope: ICloudSyncScope.SHARED,
                    records: [],
                    changedShares: [],
                    deletions: [
                        { zoneName: 'household-zone', ownerName: '__defaultOwner__', recordType: 'TransactionLeg', recordName: leg.syncId }
                    ]
                };
                yield* context.run(
                    Effect.gen(function* () {
                        const service = yield* syncService;
                        yield* matchZoneLineage(context);
                        yield* service.reconfigure;
                        yield* uploadDevice(testDb, clouds);
                        yield* service.handleFetchedChanges(deletion);
                        yield* service.handleStateSerialization({ scope: ICloudSyncScope.SHARED, stateSerialization: 'after-deletion' });
                        expect(context.store.holder.state.sharedStateSerialization).toBe('before-deletion');
                    })
                );
                const restarted = makeSyncServiceContext(testDb, context.store);
                yield* restarted.run(
                    Effect.gen(function* () {
                        const service = yield* syncService;
                        expect(yield* countRows(testDb, "sync_outbox WHERE record_type = 'Transaction' AND operation = 'SAVE'")).toBe(0);
                        expect(restarted.store.holder.state.sharedStateSerialization).toBe('before-deletion');
                        yield* matchZoneLineage(restarted);
                        yield* service.reconfigure;
                        yield* uploadDevice(testDb, clouds);
                        yield* service.handleFetchedChanges(deletion);
                        yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });
                        expect(
                            flattenBatches(restarted.transport.calls.sharedSavedBatches).some(record => record.recordName === leg.syncId)
                        ).toBe(true);
                        yield* uploadDevice(testDb, clouds);
                        expect(clouds.household.inventory(HOUSEHOLD_SYNC_ZONE).has(leg.syncId)).toBe(true);
                        yield* service.handleStateSerialization({ scope: ICloudSyncScope.SHARED, stateSerialization: 'after-flush' });
                        expect(restarted.store.holder.state.sharedStateSerialization).toBe('after-flush');
                    })
                );
                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'member-after-resend'));
                yield* expectLedgers(deviceB, testDb);
            })
        );

        it.effect('flushes a resumed owner leg deletion after a kill without redelivery', () =>
            Effect.gen(function* () {
                const { deviceB, clouds, leg } = yield* startOwnerLegDeletion;
                const heldDeletion = `sync_pending WHERE sync_id = '${leg.syncId}' AND missing_record_type = 'SchemaVersion'`;
                yield* testDb.$client.unsafe(
                    "INSERT INTO sync_pending (sync_zone, sync_id, record_type, missing_record_type, missing_sync_id, payload) VALUES (?1, ?2, 'TransactionLeg', 'SchemaVersion', ?1, json_object('deletion', json('true'), 'recordType', 'TransactionLeg', 'recordName', ?2, 'zone', ?1))",
                    [HOUSEHOLD_SYNC_ZONE, leg.syncId]
                );
                const context = makeSyncServiceContext(testDb);
                yield* context.run(
                    Effect.gen(function* () {
                        const service = yield* syncService;
                        yield* matchZoneLineage(context);
                        yield* service.reconfigure;
                        yield* uploadDevice(testDb, clouds);
                    })
                );
                expect(yield* countRows(testDb, heldDeletion)).toBe(1);
                const restarted = makeSyncServiceContext(testDb, context.store);
                yield* restarted.run(
                    Effect.gen(function* () {
                        const service = yield* syncService;
                        yield* matchZoneLineage(restarted);
                        yield* service.reconfigure;
                        yield* uploadDevice(testDb, clouds);
                        yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });
                        yield* uploadDevice(testDb, clouds);
                    })
                );
                expect(clouds.household.inventory(HOUSEHOLD_SYNC_ZONE).has(leg.syncId)).toBe(true);
                expect(yield* countRows(testDb, heldDeletion)).toBe(0);
                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'member-after-resume'));
                yield* expectLedgers(deviceB, testDb);
            })
        );

        it.effect('never sends the private leg of a shared-to-private transfer to the member', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'member-device'));
                expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM accounts`)).toEqual([
                    { title: 'Joint', sync_zone: HOUSEHOLD_SYNC_ZONE }
                ]);
                expect(yield* countRows(deviceB, `transactions`)).toBe(1);
                expect(yield* queryRows(deviceB, `SELECT amount FROM transaction_entries`)).toEqual([{ amount: SHARED_AMOUNT }]);
                expect(yield* countRows(deviceB, `tags`)).toBe(0);
                expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);

                const stored = yield* queryRows<{ readonly payload: string }>(deviceB, `SELECT payload FROM sync_record`);
                const everythingStored = stored.map(({ payload }) => payload).join('\n');

                for (const privateString of PRIVATE_STRINGS) {
                    expect(everythingStored).not.toContain(privateString);
                }

                expect(
                    yield* countRows(
                        deviceB,
                        `sync_record WHERE record_type = 'TransactionLeg' AND json_extract(payload, '$.encryptedFields.privateOwnerName') IS NULL`
                    )
                ).toBe(1);

                yield* testDb.$client.unsafe(`UPDATE transactions SET comment = 'edited private memo' WHERE comment = 'private memo'`);
                yield* uploadDevice(testDb, clouds);

                const afterPrivateEdit = yield* pullHousehold(deviceB, clouds, 'member-device');

                expect(afterPrivateEdit.flatMap(result => Object.keys(result.touched))).toEqual([]);
                expect(
                    yield* countRows(
                        testDb,
                        `transaction_entries e INNER JOIN accounts a ON a.id = e.account_id WHERE e.sync_zone <> a.sync_zone`
                    )
                ).toBe(0);
                yield* expectLedgers(deviceB, testDb);
            })
        );

        it.effect('joins the shared leg back into the whole transfer on the owner second device', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.OWNER);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'owner-b'));
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_SYNC_ZONE}'`)).toBe(1);

                expectNoRejections(yield* pullZones(deviceB, clouds.personal, 'owner-b', [PERSONAL_SYNC_ZONE], { order: 'reverse' }));
                expect(yield* countRows(deviceB, `transactions WHERE title = 'Top up savings'`)).toBe(1);
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_SYNC_ZONE}'`)).toBe(0);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT e.sync_zone AS zone, e.amount AS amount FROM transaction_entries e INNER JOIN transactions t ON t.id = e.transaction_id WHERE t.title = 'Top up savings' ORDER BY e.amount`
                    )
                ).toEqual([
                    { zone: PERSONAL_SYNC_ZONE, amount: PRIVATE_AMOUNT },
                    { zone: HOUSEHOLD_SYNC_ZONE, amount: SHARED_AMOUNT }
                ]);
                yield* expectLedgers(deviceB, testDb);
            })
        );
    });
});
