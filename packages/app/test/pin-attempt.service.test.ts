import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { PinAttemptService } from '../src/auth/service/pin-attempt.service';

const secureStore = vi.hoisted(() => new Map<string, string>());
const writeFailure = vi.hoisted(() => ({ isEnabled: false }));

vi.mock('expo-secure-store', () => ({
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    getItemAsync: (key: string) => Promise.resolve(secureStore.get(key) ?? null),
    setItemAsync: (key: string, value: string) =>
        writeFailure.isEnabled ? Promise.reject(new Error('write failed')) : Promise.resolve(void secureStore.set(key, value)),
    deleteItemAsync: (key: string) => Promise.resolve(void secureStore.delete(key))
}));

const remainingMillis = Effect.flatMap(PinAttemptService, pinAttemptService => pinAttemptService.getRemainingLockoutMillis());

const failAttempts = (count: number) =>
    Effect.flatMap(PinAttemptService, pinAttemptService =>
        Effect.forEach(
            Array.from({ length: count }),
            () =>
                remainingMillis.pipe(
                    Effect.flatMap(millis => TestClock.adjust(millis)),
                    Effect.andThen(pinAttemptService.verify(Effect.succeed(false)))
                ),
            { discard: true }
        )
    );

const lockoutAfterFailures = (failures: number) =>
    Effect.gen(function* () {
        secureStore.clear();
        yield* failAttempts(failures);

        return yield* remainingMillis;
    }).pipe(Effect.provide(PinAttemptService.layer));

describe('PinAttemptService', () => {
    it.effect('grows the wait after the fifth wrong PIN and caps it at one hour', () =>
        Effect.gen(function* () {
            const lockouts = yield* Effect.forEach([4, 5, 6, 7, 8, 9, 12], failures => lockoutAfterFailures(failures));

            expect(lockouts).toEqual([0, 30_000, 60_000, 300_000, 900_000, 3_600_000, 3_600_000]);
        })
    );

    it.effect('rejects every PIN during a lockout without counting it', () =>
        Effect.gen(function* () {
            secureStore.clear();
            const pinAttemptService = yield* PinAttemptService;

            yield* failAttempts(5);
            const isAccepted = yield* pinAttemptService.verify(Effect.succeed(true));
            yield* TestClock.adjust('10 seconds');

            expect(isAccepted).toBe(false);
            expect(yield* remainingMillis).toBe(20_000);
        }).pipe(Effect.provide(PinAttemptService.layer))
    );

    it.effect('resets the counter on a correct PIN after the lockout ends', () =>
        Effect.gen(function* () {
            secureStore.clear();
            const pinAttemptService = yield* PinAttemptService;

            yield* failAttempts(5);
            yield* TestClock.adjust('30 seconds');
            const isAccepted = yield* pinAttemptService.verify(Effect.succeed(true));
            yield* failAttempts(5);

            expect(isAccepted).toBe(true);
            expect(yield* remainingMillis).toBe(30_000);
        }).pipe(Effect.provide(PinAttemptService.layer))
    );

    it.effect('keeps the lockout across a relaunch and a clock rollback', () =>
        Effect.gen(function* () {
            secureStore.clear();
            yield* TestClock.setTime(1_000_000);
            yield* failAttempts(6).pipe(Effect.provide(PinAttemptService.layer));
            yield* TestClock.setTime(0);

            expect(yield* remainingMillis.pipe(Effect.provide(PinAttemptService.layer))).toBe(60_000);

            yield* TestClock.adjust('59 seconds');

            expect(yield* remainingMillis.pipe(Effect.provide(PinAttemptService.layer))).toBe(1_000);
        })
    );

    it.effect('resets the counter after a biometric unlock', () =>
        Effect.gen(function* () {
            secureStore.clear();
            const pinAttemptService = yield* PinAttemptService;

            yield* failAttempts(5);
            yield* pinAttemptService.reset();

            expect(yield* remainingMillis).toBe(0);
        }).pipe(Effect.provide(PinAttemptService.layer))
    );

    it.effect('keeps the positive lockout when the clock rollback write is rejected', () =>
        Effect.gen(function* () {
            secureStore.clear();
            writeFailure.isEnabled = false;
            yield* TestClock.setTime(1_000_000);
            yield* failAttempts(6).pipe(Effect.provide(PinAttemptService.layer));
            yield* TestClock.setTime(0);
            writeFailure.isEnabled = true;

            const lockout = yield* remainingMillis.pipe(
                Effect.provide(PinAttemptService.layer),
                Effect.ensuring(Effect.sync(() => void (writeFailure.isEnabled = false)))
            );

            expect(lockout).toBe(60_000);
        })
    );

    it.effect('fails closed with a one hour lockout on a corrupt record', () =>
        Effect.gen(function* () {
            secureStore.clear();
            secureStore.set('user_pin_attempts', '{broken');
            const pinAttemptService = yield* PinAttemptService;

            const lockout = yield* remainingMillis;
            const isAccepted = yield* pinAttemptService.verify(Effect.succeed(false));

            expect(lockout).toBe(3_600_000);
            expect(isAccepted).toBe(false);
            expect(yield* remainingMillis).toBe(3_600_000);
            expect(Array.from(secureStore.values())[0]).toContain('"failedAttempts":9');
        }).pipe(Effect.provide(PinAttemptService.layer))
    );

    it.effect('treats a missing record as no attempts', () =>
        Effect.gen(function* () {
            secureStore.clear();

            expect(yield* remainingMillis).toBe(0);
            expect(secureStore.size).toBe(0);
        }).pipe(Effect.provide(PinAttemptService.layer))
    );
});
