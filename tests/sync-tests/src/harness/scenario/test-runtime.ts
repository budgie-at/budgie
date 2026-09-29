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

import { testDb } from './setup';
import { sleepMode } from './sleep-mode';

const rateLimitDurationsMs = new Set([MONOBANK_RATE_LIMIT_MS, BINANCE_RATE_LIMIT_MS]);

const instantRateLimitClock = Layer.effect(
    Clock.Clock,
    Effect.clockWith(clock =>
        Effect.succeed(
            Object.assign(Object.create(clock), {
                sleep: (duration: Parameters<Clock.Clock['sleep']>[0]) =>
                    sleepMode.isRateLimitInstant && !vi.isFakeTimers() && rateLimitDurationsMs.has(Duration.toMillis(duration))
                        ? Effect.yieldNow
                        : clock.sleep(duration)
            })
        )
    )
);

const buildRuntime = () =>
    ManagedRuntime.make(Layer.mergeAll(Layer.succeed(Db, testDb), FetchHttpClient.layer, Workload.layer, instantRateLimitClock));

let runtime = buildRuntime();

export type Services = ManagedRuntime.ManagedRuntime.Services<ReturnType<typeof buildRuntime>>;

export const testRuntime = {
    runPromise: <A, E>(effect: Effect.Effect<A, E, Services>) => runtime.runPromise(effect),
    runFork: <A, E>(effect: Effect.Effect<A, E, Services>) => runtime.runFork(effect)
};

export const run = testRuntime.runPromise;

export const resetTestRuntime = async (): Promise<void> => {
    await runtime.dispose();
    runtime = buildRuntime();
};
