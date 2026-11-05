import { makeTestDbLayer } from '@budgie-at/test-kit';
import { Db, SyncRecordTypeEnum, decodeSyncRecord, joinSplitTransactions } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../../harness/scenario/setup';

import {
    encodeAllRecords,
    hydratedSnapshot,
    loadSyncState,
    materializeRecords,
    prepareTarget,
    seedCrossZoneTransfer,
    throughTransport
} from './record-mapping-harness';

const SHARED_ZONE = 'household';
const SHARED_AMOUNT = 7_654_321;
const PRIVATE_AMOUNT = 3_141_592;

const seedAndEncode = Effect.gen(function* () {
    const fixture = yield* seedCrossZoneTransfer(testDb, SHARED_ZONE);
    const state = yield* loadSyncState(testDb);
    const records = yield* encodeAllRecords(state);
    const home = records.find(record => record.recordType === SyncRecordTypeEnum.TRANSACTION);
    const leg = records.find(record => record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG);

    if (!isDefined(home) || !isDefined(leg)) {
        return yield* Effect.die('expected a home record and a leg record');
    }

    const identities = yield* testDb.$client.unsafe<{ readonly kind: string; readonly syncId: string }>(
        `SELECT 'privateAccount' AS kind, sync_id AS syncId FROM accounts WHERE id = ${fixture.privateAccount.id}
         UNION ALL SELECT 'sharedAccount', sync_id FROM accounts WHERE id = ${fixture.sharedAccount.id}
         UNION ALL SELECT 'tag', sync_id FROM tags WHERE id = ${fixture.privateTag.id}
         UNION ALL SELECT 'transaction', sync_id FROM transactions WHERE id = ${fixture.transfer.id}
         UNION ALL SELECT 'privateEntry', sync_id FROM transaction_entries WHERE account_id = ${fixture.privateAccount.id}
         UNION ALL SELECT 'sharedEntry', sync_id FROM transaction_entries WHERE account_id = ${fixture.sharedAccount.id}`
    );

    return { records, home, leg, syncIds: Object.fromEntries(identities.map(({ kind, syncId }) => [kind, syncId])) };
});

describe('cloud-sync/record-mapping split transfers', () => {
    it.effect('splits a shared-to-private transfer into a private home record and an opaque shared leg', () =>
        Effect.gen(function* () {
            const { records, home, leg, syncIds } = yield* seedAndEncode;
            const transactionRecords = records.filter(
                record => record.recordType === SyncRecordTypeEnum.TRANSACTION || record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG
            );
            const legFields = leg.encryptedFields;
            const serializedLeg = JSON.stringify(leg);

            expect(transactionRecords).toHaveLength(2);
            expect(home.zone).toBe('personal');
            expect(home.recordName).toBe(syncIds['transaction']);
            expect(leg.zone).toBe(SHARED_ZONE);
            expect(leg.recordName).toBe(home.encryptedFields['linkId']);
            expect(legFields['linkId']).toBe(home.encryptedFields['linkId']);
            expect(home.encryptedFields['legCount']).toBe(1);
            expect(Object.keys(legFields).sort()).toEqual(
                ['createdAt', 'entries', 'fromAccountSyncId', 'linkId', 'operatedAt', 'type', 'updatedAt'].sort()
            );
            expect(legFields['fromAccountSyncId']).toBe(syncIds['sharedAccount']);

            for (const privateValue of [
                syncIds['privateAccount'],
                syncIds['privateEntry'],
                syncIds['tag'],
                syncIds['transaction'],
                'private memo',
                `${PRIVATE_AMOUNT}`,
                'secret-plan',
                'private-fingerprint',
                'UA-PRIVATE-IBAN',
                'Top up savings'
            ]) {
                expect(serializedLeg).not.toContain(privateValue);
            }

            expect(home.encryptedFields['comment']).toBe('private memo');
            expect(home.encryptedFields['tags']).toBeDefined();
        })
    );

    it.effect('keeps only the shared entries in the shared leg', () =>
        Effect.gen(function* () {
            const { leg, syncIds } = yield* seedAndEncode;
            const entries: unknown = JSON.parse(`${leg.encryptedFields['entries']}`);

            expect(entries).toEqual([
                expect.objectContaining({ syncId: syncIds['sharedEntry'], accountSyncId: syncIds['sharedAccount'], amount: SHARED_AMOUNT })
            ]);
            expect(JSON.stringify(entries)).not.toContain('toIban');
        })
    );

    it.layer(makeTestDbLayer(null))('on the owner device', it => {
        it.effect('joins both records back into the original transaction in a fresh database', () =>
            Effect.gen(function* () {
                const targetDatabase = yield* Db;
                const { records } = yield* seedAndEncode;

                yield* prepareTarget(targetDatabase);

                const decoded = yield* Effect.forEach(throughTransport(records), record => decodeSyncRecord(record));
                const { joined, unmatched } = joinSplitTransactions([...decoded].reverse());
                const unresolved = yield* materializeRecords(targetDatabase, joined);
                const source = yield* hydratedSnapshot(testDb);
                const target = yield* hydratedSnapshot(targetDatabase);

                expect(unmatched).toEqual([]);
                expect(unresolved).toEqual([]);
                expect(joined.filter(record => record.recordType === SyncRecordTypeEnum.TRANSACTION)).toHaveLength(1);
                expect(target['transaction_entries']).toHaveLength(2);
                expect(new Set(target['transaction_entries'].map(row => row['sync_zone']))).toEqual(new Set(['personal', SHARED_ZONE]));
                expect(target).toEqual(source);
            })
        );
    });

    it.effect('does not join incomplete pairs and ignores a replayed leg', () =>
        Effect.gen(function* () {
            const { home, leg } = yield* seedAndEncode;
            const decodedHome = yield* decodeSyncRecord(throughTransport([home])[0]);
            const decodedLeg = yield* decodeSyncRecord(throughTransport([leg])[0]);
            const homeOnly = joinSplitTransactions([decodedHome]);
            const legOnly = joinSplitTransactions([decodedLeg]);
            const replayed = joinSplitTransactions([decodedLeg, decodedHome, decodedLeg]);

            expect(homeOnly.joined.filter(record => record.linkId !== null)).toEqual([]);
            expect(homeOnly.unmatched).toEqual([decodedHome]);
            expect(legOnly.joined).toEqual([]);
            expect(legOnly.unmatched).toEqual([decodedLeg]);
            expect(replayed.unmatched).toEqual([]);
            expect(replayed.joined.filter(record => record.recordType === SyncRecordTypeEnum.TRANSACTION)).toHaveLength(1);
        })
    );
});
