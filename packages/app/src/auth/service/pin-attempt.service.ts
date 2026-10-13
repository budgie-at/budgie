import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { PIN_ATTEMPTS_KEY } from '../constant/pin-attempts-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';

export class PinAttemptService extends Context.Service<PinAttemptService>()('@budgie/app/PinAttemptService', {
    make: Effect.gen(function* () {
        const lock = yield* Semaphore.make(1);
        const freeAttempts = 5;
        const lockoutDurations = [Duration.seconds(30), Duration.minutes(1), Duration.minutes(5), Duration.minutes(15), Duration.hours(1)];
        const PinAttemptsSchema = Schema.fromJsonString(
            Schema.Struct({ failedAttempts: Schema.Number, lockoutStartedAt: Schema.Number, lockoutEndsAt: Schema.Number })
        );
        const noAttempts: typeof PinAttemptsSchema.Type = { failedAttempts: 0, lockoutStartedAt: 0, lockoutEndsAt: 0 };

        const getLockoutMillis = (failedAttempts: number) => {
            const durationIndex = Math.min(failedAttempts - freeAttempts, lockoutDurations.length - 1);

            return durationIndex < 0 ? 0 : Duration.toMillis(lockoutDurations[durationIndex]);
        };

        const readAttempts = Effect.promise(() => SecureStore.getItemAsync(PIN_ATTEMPTS_KEY, PIN_SECURE_STORE_OPTIONS)).pipe(
            Effect.flatMap(value =>
                isNotEmptyString(value) ? Schema.decodeUnknownEffect(PinAttemptsSchema)(value) : Effect.succeed(noAttempts)
            ),
            Effect.orElseSucceed(() => noAttempts)
        );

        const writeAttempts = Effect.fnUntraced(function* (attempts: typeof PinAttemptsSchema.Type) {
            const value = yield* Schema.encodeEffect(PinAttemptsSchema)(attempts).pipe(Effect.orDie);

            yield* Effect.promise(() => SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, value, PIN_SECURE_STORE_OPTIONS));
        });

        const clearAttempts = Effect.promise(() => SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY, PIN_SECURE_STORE_OPTIONS));

        const readRemainingLockoutMillis = Effect.fnUntraced(function* () {
            const attempts = yield* readAttempts;
            const now = yield* Clock.currentTimeMillis;

            if (now >= attempts.lockoutStartedAt) {
                return Math.max(0, attempts.lockoutEndsAt - now);
            }

            const lockoutMillis = attempts.lockoutEndsAt - attempts.lockoutStartedAt;

            yield* writeAttempts({ ...attempts, lockoutStartedAt: now, lockoutEndsAt: now + lockoutMillis });

            return lockoutMillis;
        });

        const recordAttempt = Effect.fnUntraced(function* (isCorrect: boolean) {
            if (isCorrect) {
                return yield* clearAttempts;
            }

            const attempts = yield* readAttempts;
            const now = yield* Clock.currentTimeMillis;
            const failedAttempts = attempts.failedAttempts + 1;

            return yield* writeAttempts({ failedAttempts, lockoutStartedAt: now, lockoutEndsAt: now + getLockoutMillis(failedAttempts) });
        });

        return {
            getRemainingLockoutMillis: () => lock.withPermit(readRemainingLockoutMillis()),
            verify: Effect.fn('PinAttemptService.verify')(function* <E, R>(check: Effect.Effect<boolean, E, R>) {
                return yield* lock
                    .withPermit(
                        Effect.gen(function* () {
                            if (isPositiveNumber(yield* readRemainingLockoutMillis())) {
                                return false;
                            }

                            const isCorrect = yield* check;

                            yield* recordAttempt(isCorrect);

                            return isCorrect;
                        })
                    )
                    .pipe(Effect.uninterruptible);
            }),
            reset: () => lock.withPermit(clearAttempts)
        };
    })
}) {
    static readonly layer = Layer.effect(PinAttemptService, PinAttemptService.make);
}
