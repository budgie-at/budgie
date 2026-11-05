import { SyncAutomationService } from '@app/cloud-sync-automation/service/sync-automation.service';
import { SyncAutomationEmbeddingBoost } from '@app/cloud-sync-automation/service/sync-automation-embedding-boost.service';
import { P2pTransferTitleResolver } from '@budgie/consolidation';
import { Db, RecurringSeriesUserStateEnum, SyncApplyService } from '@budgie/contracts';
import { LedgerWorkload } from '@budgie/ledger';
import { RecurringService } from '@budgie/recurring';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { deviceLayer, pushDevice, readOutboxRows } from './apply-harness';

import type { FakeCloudDeliveryOptionsInterface, FakeCloudTransport } from '@budgie-at/test-kit';
import type { DB } from '@budgie/contracts';

const MAX_SETTLE_ROUNDS = 6;

export const embeddingBoostProbe = { calls: 0 };

const automationLayer = Layer.mergeAll(
    deviceLayer,
    SyncAutomationService.layer.pipe(
        Layer.provide([
            Layer.succeed(
                SyncAutomationEmbeddingBoost,
                Effect.sync(() => {
                    embeddingBoostProbe.calls += 1;
                })
            ),
            Layer.succeed(LedgerWorkload, LedgerWorkload.of({ runForeground: effect => effect })),
            Layer.succeed(P2pTransferTitleResolver, (_direction, assetCode) => `P2P ${assetCode}`)
        ])
    ),
    RecurringService.layer
);

export const onAutomatedDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<A, E, Db | SyncApplyService | SyncAutomationService | RecurringService>
) => effect.pipe(Effect.provide(automationLayer), Effect.provideService(Db, database));

export const pullWithAutomation = (database: DB, cloud: FakeCloudTransport, deviceId: string, options: FakeCloudDeliveryOptionsInterface = {}) =>
    onAutomatedDevice(
        database,
        Effect.gen(function* () {
            const applyService = yield* SyncApplyService;
            const automationService = yield* SyncAutomationService;
            let applied = 0;

            for (const batch of cloud.pull(deviceId, options)) {
                yield* automationService.afterApply(yield* applyService.apply(batch));
                applied += 1;
            }

            return applied;
        })
    );

export const detectRecurring = (database: DB) =>
    onAutomatedDevice(
        database,
        Effect.gen(function* () {
            const recurringService = yield* RecurringService;

            yield* recurringService.detect(new Date());
        })
    );

export const settleDevices = (deviceA: DB, deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        for (let round = 1; round <= MAX_SETTLE_ROUNDS; round += 1) {
            yield* pushDevice(deviceA, cloud);
            yield* pushDevice(deviceB, cloud);
            yield* pullWithAutomation(deviceA, cloud, 'device-a');
            yield* pullWithAutomation(deviceB, cloud, 'device-b');

            const outboxSizes = [(yield* readOutboxRows(deviceA)).length, (yield* readOutboxRows(deviceB)).length];

            if (outboxSizes.every(size => size === 0)) {
                return round;
            }
        }

        return MAX_SETTLE_ROUNDS + 1;
    });

export const reapplyAutomation = (database: DB, transactionSyncIds: readonly string[]) =>
    onAutomatedDevice(
        database,
        Effect.gen(function* () {
            const automationService = yield* SyncAutomationService;

            return yield* automationService.afterApply({
                touched: {},
                touchedRows: { transactions: transactionSyncIds },
                deleted: {},
                heldBack: 0,
                skipped: 0,
                rejected: [],
                pausedZones: [],
                reenqueued: [],
                merged: []
            });
        })
    );

export const syncIdsOf = (database: DB, tableName: string) =>
    database.$client
        .unsafe<{ readonly syncId: string }>(`SELECT sync_id AS syncId FROM "${tableName}" ORDER BY rowid`)
        .pipe(Effect.map(rows => rows.map(({ syncId }) => syncId)));

export const dismissSeries = (database: DB) =>
    onAutomatedDevice(
        database,
        Effect.gen(function* () {
            const recurringService = yield* RecurringService;
            const rows = yield* database.$client.unsafe<{ readonly id: number }>(`SELECT id FROM recurring_series WHERE deleted_at IS NULL`);

            for (const { id } of rows) {
                yield* recurringService.setUserState(id, RecurringSeriesUserStateEnum.DISMISSED);
            }
        })
    );
