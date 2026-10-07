import { appServicesLayer } from '@app/@generic/runtime/app-services.layer';
import { makeTestPlatformLayer } from '@budgie-at/test-kit';
import { BINANCE_RATE_LIMIT_MS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { testDb } from './setup';
import { sleepMode } from './sleep-mode';

import type * as Context from 'effect/Context';

const rateLimitDurationsMs = [MONOBANK_RATE_LIMIT_MS, BINANCE_RATE_LIMIT_MS];

const isRateLimitWait = (durationMs: number): boolean =>
    rateLimitDurationsMs.some(rateLimitMs => durationMs > rateLimitMs / 2 && durationMs <= rateLimitMs);

const withInstantRateLimit = (clock: Clock.Clock): Clock.Clock =>
    Object.assign(Object.create(clock), {
        sleep: (duration: Parameters<Clock.Clock['sleep']>[0]) =>
            sleepMode.isRateLimitInstant && !vi.isFakeTimers() && isRateLimitWait(Duration.toMillis(duration))
                ? Effect.yieldNow
                : clock.sleep(duration)
    });

const servicesLayer = appServicesLayer.pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));

export type Services = Layer.Success<typeof servicesLayer>;

let testContext: Context.Context<Services> | null = null;

const bindAppRuntime = Layer.effectDiscard(
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
).pipe(Layer.provideMerge(servicesLayer));

export const TestClockLayer = bindAppRuntime;

export const TestLayer = bindAppRuntime.pipe(
    Layer.provideMerge(Layer.succeed(Clock.Clock, withInstantRateLimit(Clock.Clock.defaultValue())))
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
