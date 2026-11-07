import { assertStoredBalancesMatchLedger, encodeJson } from '@budgie-at/test-kit';
import { SYNC_RECORD_SCHEMA_VERSION, SyncAccountBalanceRefresher, SyncApplyService, SyncOutboxRepository } from '@budgie/cloud-sync';
import { Db, SyncRecordRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isString } from '@rnw-community/shared';

import { encodeAllRecords, hydratedSnapshot, loadSyncState } from './record-mapping-harness';

import type { FakeCloudDeliveryOptionsInterface, FakeCloudTransport } from '../../harness';
import type { SyncApplyResultInterface } from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

interface OutboxKeyInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly operation: string;
}

const refresherLayer = Layer.effect(
    SyncAccountBalanceRefresher,
    Effect.gen(function* () {
        const balances = yield* AccountBalanceIncrementalService;

        return {
            refresh: (accountIds: readonly number[]) =>
                balances
                    .updateBalancesByAccountIds([...accountIds])
                    .pipe(Effect.catchTags({ DepositNegativeBalanceError: () => Effect.void, AccountNotFoundError: () => Effect.void }))
        };
    })
).pipe(Layer.provide(AccountBalanceIncrementalService.layer));

export const deviceLayer = Layer.mergeAll(
    SyncApplyService.layer.pipe(Layer.provide(refresherLayer)),
    SyncRecordRepository.layer,
    SyncOutboxRepository.layer,
    AccountBalanceIncrementalService.layer
);

export const onDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<A, E, Db | SyncApplyService | SyncRecordRepository | SyncOutboxRepository | AccountBalanceIncrementalService>
) => effect.pipe(Effect.provide(deviceLayer), Effect.provideService(Db, database));

export const refreshAllBalances = (database: DB) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const accounts = yield* database.$client.unsafe<{ readonly id: number }>('SELECT id FROM accounts');
            const balances = yield* AccountBalanceIncrementalService;

            yield* balances
                .updateBalancesByAccountIds(accounts.map(({ id }) => id))
                .pipe(Effect.catchTags({ DepositNegativeBalanceError: () => Effect.void, AccountNotFoundError: () => Effect.void }));
        })
    );

export const expectBalancesMatchLedger = (database: DB) => assertStoredBalancesMatchLedger(database);

export const pushDevice = (database: DB, cloud: FakeCloudTransport) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const outbox = yield* database.$client.unsafe<OutboxKeyInterface>(
                `SELECT sync_zone AS syncZone, sync_id AS syncId, operation FROM sync_outbox ORDER BY id`
            );
            const state = yield* loadSyncState(database);
            const records = yield* encodeAllRecords(state);
            const outboxNames = new Set(outbox.filter(({ operation }) => operation === 'SAVE').map(({ syncId }) => syncId));
            const linkIds = new Set(
                records
                    .filter(({ recordName }) => outboxNames.has(recordName))
                    .map(({ encryptedFields }) => encryptedFields['linkId'])
                    .filter(isString)
            );
            const selected = records.filter(
                ({ recordName, encryptedFields }) =>
                    outboxNames.has(recordName) || (isString(encryptedFields['linkId']) && linkIds.has(encryptedFields['linkId']))
            );
            const recordRepository = yield* SyncRecordRepository;
            const systemFields = cloud.upload(selected);

            for (const [index, record] of selected.entries()) {
                yield* recordRepository.upsert({
                    syncZone: record.zone,
                    syncId: record.recordName,
                    recordType: record.recordType,
                    systemFields: systemFields[index],
                    payload: encodeJson(record),
                    schemaVersion: SYNC_RECORD_SCHEMA_VERSION
                });
            }

            yield* database.$client.unsafe(`DELETE FROM sync_outbox`);

            return selected.length;
        })
    );

export const pullDevice = (database: DB, cloud: FakeCloudTransport, deviceId: string, options: FakeCloudDeliveryOptionsInterface = {}) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const applyService = yield* SyncApplyService;
            const results: SyncApplyResultInterface[] = [];

            for (const batch of cloud.pull(deviceId, options)) {
                results.push(yield* applyService.apply(batch));
            }

            return results;
        })
    );

export const readOutboxRows = (database: DB) =>
    database.$client.unsafe<{
        readonly recordType: string;
        readonly syncId: string;
        readonly operation: string;
        readonly changedColumns: string;
    }>(`SELECT record_type AS recordType, sync_id AS syncId, operation, changed_columns AS changedColumns FROM sync_outbox ORDER BY id`);

export const stateSnapshot = (database: DB) => hydratedSnapshot(database);
