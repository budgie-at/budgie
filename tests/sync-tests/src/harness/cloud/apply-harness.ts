import { encodeJson } from '@budgie-at/test-kit';
import {
    SYNC_RECORD_SCHEMA_VERSION,
    SyncAccountBalanceRefresher,
    SyncApplyService,
    SyncUploadService,
    SyncOutboxRepository
} from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncRecordRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { encodeAllRecords } from './record-mapping-harness';

import type { FakeCloudDeliveryOptionsInterface } from './fake-cloud-delivery-options.interface';
import type { FakeCloudTransport } from './fake-cloud-transport';
import type { ShareCloudsInterface } from './share-harness';
import type { SyncUploadAcknowledgementInterface, SyncApplyResultInterface } from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

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
    SyncUploadService.layer,
    AccountBalanceIncrementalService.layer
);

export const onDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<
        A,
        E,
        Db | SyncApplyService | SyncUploadService | SyncRecordRepository | SyncOutboxRepository | AccountBalanceIncrementalService
    >
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

type EncodedRecord = Effect.Success<ReturnType<typeof encodeAllRecords>>[number];
type PulledBatch = ReturnType<FakeCloudTransport['pull']>[number];

export const uploadRecords = (cloud: FakeCloudTransport, records: readonly EncodedRecord[]) =>
    Effect.gen(function* () {
        const recordRepository = yield* SyncRecordRepository;
        const systemFields = cloud.upload(records);

        for (const [index, record] of records.entries()) {
            yield* recordRepository.upsert({
                syncZone: record.zone,
                syncId: record.recordName,
                recordType: record.recordType,
                systemFields: systemFields[index],
                payload: encodeJson(record),
                schemaVersion: SYNC_RECORD_SCHEMA_VERSION
            });
        }
    });

export const applyPulledBatches = (
    cloud: FakeCloudTransport,
    deviceId: string,
    options: FakeCloudDeliveryOptionsInterface,
    narrow: (batch: PulledBatch) => PulledBatch = batch => batch
) =>
    Effect.gen(function* () {
        const applyService = yield* SyncApplyService;
        const results: SyncApplyResultInterface[] = [];

        for (const batch of cloud.pull(deviceId, options)) {
            results.push(yield* applyService.apply(narrow(batch)));
        }

        return results;
    });

export const uploadDevice = (database: DB, clouds: ShareCloudsInterface) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const uploadService = yield* SyncUploadService;
            const outbox = yield* database.$client.unsafe<{
                readonly recordType: string;
                readonly syncZone: string;
                readonly syncId: string;
            }>(`SELECT record_type AS recordType, sync_zone AS syncZone, sync_id AS syncId FROM sync_outbox`);
            const recordTypes = new Map(outbox.map(row => [`${row.syncZone}|${row.syncId}`, row.recordType]));
            const batch = yield* uploadService.pending(10_000, new Set());

            if (batch.rejections.length > 0) {
                return yield* Effect.die(`upload rejected: ${encodeJson(batch.rejections)}`);
            }

            const acknowledgements: SyncUploadAcknowledgementInterface[] = [];

            const cloudFor = (zone: string): FakeCloudTransport => (zone === HOUSEHOLD_SYNC_ZONE ? clouds.household : clouds.personal);

            for (const save of batch.saves) {
                const systemFields = save.records.map(record => cloudFor(record.zone).upload([record])[0]);

                for (const target of save.staleTargets) {
                    cloudFor(target.zone).remove('TransactionLeg', target.zone, target.recordName);
                }

                acknowledgements.push({
                    syncZone: save.syncZone,
                    syncId: save.syncId,
                    syncRevision: save.syncRevision,
                    sentRecords: save.records.map((record, index) => ({ record, systemFields: systemFields[index] })),
                    deletedTargets: save.staleTargets
                });
            }

            for (const deletion of batch.deletions) {
                for (const target of deletion.targets) {
                    cloudFor(target.zone).remove(
                        recordTypes.get(`${target.zone}|${target.recordName}`) ?? 'TransactionLeg',
                        target.zone,
                        target.recordName
                    );
                }

                acknowledgements.push({
                    syncZone: deletion.syncZone,
                    syncId: deletion.syncId,
                    syncRevision: deletion.syncRevision,
                    sentRecords: [],
                    deletedTargets: deletion.targets
                });
            }

            yield* uploadService.acknowledge(acknowledgements);

            return batch;
        })
    );

export const pushDevice = (database: DB, cloud: FakeCloudTransport) =>
    uploadDevice(database, { personal: cloud, household: cloud }).pipe(Effect.map(batch => batch.saves.length));

export const pullDevice = (database: DB, cloud: FakeCloudTransport, deviceId: string, options: FakeCloudDeliveryOptionsInterface = {}) =>
    onDevice(database, applyPulledBatches(cloud, deviceId, options));

export const readOutboxRows = (database: DB) =>
    database.$client.unsafe<{
        readonly recordType: string;
        readonly syncId: string;
        readonly operation: string;
        readonly changedColumns: string;
    }>(`SELECT record_type AS recordType, sync_id AS syncId, operation, changed_columns AS changedColumns FROM sync_outbox ORDER BY id`);
