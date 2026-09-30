import { Workload } from '@app/@generic/service/workload.service';
import { Db } from '@budgie/contracts';
import { BINANCE_RATE_LIMIT_MS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { testDb } from './setup';
import { sleepMode } from './sleep-mode';

import type * as Context from 'effect/Context';

const rateLimitDurationsMs = new Set([MONOBANK_RATE_LIMIT_MS, BINANCE_RATE_LIMIT_MS]);

const withInstantRateLimit = (clock: Clock.Clock): Clock.Clock =>
    Object.assign(Object.create(clock), {
        sleep: (duration: Parameters<Clock.Clock['sleep']>[0]) =>
            sleepMode.isRateLimitInstant && !vi.isFakeTimers() && rateLimitDurationsMs.has(Duration.toMillis(duration))
                ? Effect.yieldNow
                : clock.sleep(duration)
    });

const servicesLayer = Workload.layer.pipe(Layer.provideMerge(Layer.mergeAll(Layer.succeed(Db, testDb), FetchHttpClient.layer)));

const buildRuntime = () =>
    ManagedRuntime.make(
        servicesLayer.pipe(
            Layer.provideMerge(
                Layer.effect(
                    Clock.Clock,
                    Effect.clockWith(clock => Effect.succeed(withInstantRateLimit(clock)))
                )
            )
        )
    );

let runtime = buildRuntime();

export type Services = ManagedRuntime.ManagedRuntime.Services<ReturnType<typeof buildRuntime>>;

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

export const testRuntime = {
    runPromise: <A, E>(effect: Effect.Effect<A, E, Services>) =>
        isDefined(testContext) ? Effect.runPromiseWith(testContext)(effect) : runtime.runPromise(effect),
    runFork: <A, E>(effect: Effect.Effect<A, E, Services>) =>
        isDefined(testContext) ? Effect.runForkWith(testContext)(effect) : runtime.runFork(effect)
};

export const run = testRuntime.runPromise;

export const resetTestRuntime = async (): Promise<void> => {
    await runtime.dispose();
    runtime = buildRuntime();
};
