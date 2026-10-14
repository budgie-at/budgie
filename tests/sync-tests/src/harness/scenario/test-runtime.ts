import { DatabaseChangeService } from '@app/@generic/drizzle/service/database-change.service';
import { appServicesLayer, appServicesWithoutDrainerLayer } from '@app/@generic/runtime/app-services.layer';
import { makeTestDatabase, makeTestPlatformLayer } from '@budgie-at/test-kit';
import { Db } from '@budgie/contracts';
import { BINANCE_RATE_LIMIT_MS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as Atom from 'effect/reactivity/Atom';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { fakeTransferConsolidationDrainerLayer } from '../fake/fake-transfer-consolidation-drainer.layer';

import { testDb } from './setup';
import { sleepMode } from './sleep-mode';

import type * as Context from 'effect/Context';

const rateLimitDurationsMs = new Set([MONOBANK_RATE_LIMIT_MS, BINANCE_RATE_LIMIT_MS]);

const withInstantRateLimit = (clock: Clock.Clock): Clock.Clock => {
    let virtualOffsetMs = 0;

    return Object.assign(Object.create(clock), {
        currentTimeMillis: Effect.sync(() => Date.now() + virtualOffsetMs),
        currentTimeMillisUnsafe: () => Date.now() + virtualOffsetMs,
        sleep: (duration: Parameters<Clock.Clock['sleep']>[0]) => {
            if (sleepMode.isRateLimitInstant && !vi.isFakeTimers() && rateLimitDurationsMs.has(Duration.toMillis(duration))) {
                return Effect.andThen(
                    Effect.sync(() => {
                        virtualOffsetMs += Duration.toMillis(duration);
                    }),
                    Effect.yieldNow
                );
            }

            return clock.sleep(duration);
        }
    });
};

const platformLayer = makeTestPlatformLayer(testDb);

const servicesLayer = appServicesWithoutDrainerLayer.pipe(
    Layer.provideMerge(Layer.merge(fakeTransferConsolidationDrainerLayer, platformLayer))
);

const realDrainerServicesLayer = appServicesLayer.pipe(Layer.provideMerge(platformLayer));

export type Services = Layer.Success<typeof servicesLayer>;

export const liveStatements: string[] = [];

const livePlatformLayer = Layer.mergeAll(
    Layer.effect(
        Db,
        Effect.flatMap(DatabaseChangeService, databaseChangeService =>
            makeTestDatabase(testDb.$client, queryText => liveStatements.push(queryText), databaseChangeService.record)
        )
    ),
    Layer.effect(
        Db.TransactionBoundary,
        Effect.map(DatabaseChangeService, databaseChangeService => databaseChangeService.transactionBoundary)
    ),
    FetchHttpClient.layer,
    Logger.layer([])
).pipe(Layer.provideMerge(DatabaseChangeService.layer), Layer.provideMerge(Reactivity.layer));

export const testAtomRuntime = Atom.context({ memoMap: Layer.makeMemoMapUnsafe() })(
    appServicesWithoutDrainerLayer.pipe(Layer.provideMerge(Layer.merge(fakeTransferConsolidationDrainerLayer, livePlatformLayer)))
);

let testContext: Context.Context<Services> | null = null;

const bindRuntime = <ROut extends Services, E>(layer: Layer.Layer<ROut, E>) =>
    Layer.effectDiscard(
        Effect.acquireRelease(
            Effect.tap(Effect.context<Services>(), context =>
                Effect.sync(() => {
                    testContext = context;
                })
            ),
            () =>
                Effect.sync(() => {
                    testContext = null;
                })
        )
    ).pipe(Layer.provideMerge(layer));

const bindAppRuntime = bindRuntime(servicesLayer);

export const TestClockLayer = bindAppRuntime;

export const RealDrainerTestClockLayer = bindRuntime(realDrainerServicesLayer);

export const TestLayer = bindAppRuntime.pipe(
    Layer.provideMerge(
        Layer.effect(
            Clock.Clock,
            Effect.sync(() => withInstantRateLimit(Clock.Clock.defaultValue()))
        )
    )
);

const requireTestContext = (): Context.Context<Services> => {
    if (!isDefined(testContext)) {
        throw new Error('appRuntime was used outside an it.effect test that provides TestLayer or TestClockLayer');
    }

    return testContext;
};

export const testRuntime = {
    runPromise: <A, E>(effect: Effect.Effect<A, E, Services>) => Effect.runPromiseWith(requireTestContext())(effect),
    runFork: <A, E>(effect: Effect.Effect<A, E, Services>) => Effect.runForkWith(requireTestContext())(effect)
};
