import { CloudSyncService } from '@budgie/cloud-sync';
import { Db } from '@budgie/contracts';
import { TransferConsolidationDrainerService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { DatabaseLifecycleOperationEnum } from '../src/@generic/drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseConnectionService } from '../src/@generic/drizzle/service/database-connection.service';
import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { Workload } from '../src/@generic/service/workload.service';
import { HistoricalMarketDataDrainerService } from '../src/market-data/service/historical-market-data-drainer.service';
import { RuleApplicationDrainerService } from '../src/rule/service/rule-application-drainer.service';

import { inertDbLayer } from './fixture/inert-db-layer';

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('../src/@generic/drizzle/service/database-connection.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseConnectionService: Context.Service<object>('test/LifecycleConnection') };
});
vi.mock('../src/rule/service/rule-application-drainer.service', async () => {
    const Context = await import('effect/Context');

    return { RuleApplicationDrainerService: Context.Service<object>('test/LifecycleRuleDrainer') };
});
vi.mock('../src/market-data/service/historical-market-data-drainer.service', async () => {
    const Context = await import('effect/Context');

    return { HistoricalMarketDataDrainerService: Context.Service<object>('test/LifecycleMarketDrainer') };
});
vi.mock('../src/sync/layer/transfer-consolidation-drainer.layer', () => ({ transferConsolidationDrainerLayer: undefined }));

const makeHarness = (wasSyncRunning: boolean) => {
    const events: string[] = [];
    const record = (event: string) => Effect.sync(() => void events.push(event));
    const dependencies = Layer.mergeAll(
        Workload.layer,
        Layer.unwrap(Effect.map(Db, db => Layer.mock(DatabaseConnectionService)({ db, close: record('close') }))),
        Layer.mock(TransferConsolidationDrainerService)({ cancelPending: () => Effect.void }),
        Layer.mock(RuleApplicationDrainerService)({ cancelPending: () => Effect.void }),
        Layer.mock(HistoricalMarketDataDrainerService)({ cancelScheduledDrain: Effect.void })
    ).pipe(Layer.provideMerge(Layer.mergeAll(inertDbLayer, FetchHttpClient.layer)));
    const lifecycleLayer = Layer.effect(DatabaseLifecycleService, DatabaseLifecycleService.make).pipe(Layer.provide(dependencies));
    const cloudSyncLayer = Layer.mock(CloudSyncService)({
        stop: () => record('stop').pipe(Effect.as(wasSyncRunning)),
        start: () => record('start')
    });
    const replace = (isFailing: boolean) =>
        Effect.gen(function* () {
            const lifecycle = yield* DatabaseLifecycleService;

            yield* lifecycle.run(
                DatabaseLifecycleOperationEnum.IMPORT,
                lifecycle.close().pipe(Effect.andThen(isFailing ? Effect.die('replace failed') : Effect.void))
            );
        });
    const failBeforeClose = Effect.gen(function* () {
        const lifecycle = yield* DatabaseLifecycleService;

        yield* lifecycle.run(DatabaseLifecycleOperationEnum.IMPORT, record('copy').pipe(Effect.andThen(Effect.die('copy failed'))));
    });

    return { events, lifecycleLayer, cloudSyncLayer, replace, failBeforeClose };
};

describe('database lifecycle cloud sync', () => {
    it.effect('stops the sync engine before the database closes and leaves it stopped for the reload', () =>
        Effect.gen(function* () {
            const harness = makeHarness(true);

            yield* harness.replace(false).pipe(Effect.provide([harness.lifecycleLayer, harness.cloudSyncLayer, inertDbLayer]));

            expect(harness.events).toEqual(['stop', 'close']);
        })
    );
    it.effect('resumes the sync engine when the replacement fails and the old database is kept', () =>
        Effect.gen(function* () {
            const harness = makeHarness(true);

            const exit = yield* Effect.exit(
                harness.failBeforeClose.pipe(Effect.provide([harness.lifecycleLayer, harness.cloudSyncLayer, inertDbLayer]))
            );

            expect(Exit.isFailure(exit)).toBe(true);
            expect(harness.events).toEqual(['stop', 'copy', 'start']);
        })
    );
    it.effect('leaves the sync engine stopped when the failure happens after the database closed', () =>
        Effect.gen(function* () {
            const harness = makeHarness(true);

            const exit = yield* Effect.exit(
                harness.replace(true).pipe(Effect.provide([harness.lifecycleLayer, harness.cloudSyncLayer, inertDbLayer]))
            );

            expect(Exit.isFailure(exit)).toBe(true);
            expect(harness.events).toEqual(['stop', 'close']);
        })
    );
    it.effect('does not start a sync engine that was not running', () =>
        Effect.gen(function* () {
            const harness = makeHarness(false);

            yield* Effect.exit(
                harness.failBeforeClose.pipe(Effect.provide([harness.lifecycleLayer, harness.cloudSyncLayer, inertDbLayer]))
            );

            expect(harness.events).toEqual(['stop', 'copy']);
        })
    );
    it.effect('runs without a cloud sync service', () =>
        Effect.gen(function* () {
            const harness = makeHarness(true);

            yield* harness.replace(false).pipe(Effect.provide([harness.lifecycleLayer, inertDbLayer]));

            expect(harness.events).toEqual(['close']);
        })
    );
});
