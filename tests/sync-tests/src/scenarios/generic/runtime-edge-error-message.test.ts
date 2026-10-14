import { AuthService } from '@app/auth/service/auth.service';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { vi } from 'vitest';

import { getErrorMessage } from '@rnw-community/shared';

import { TestLayer } from '../../harness';

const KEYCHAIN_LOCKED = 'User interaction is not allowed.';

vi.mock('expo-secure-store', () => ({
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    getItemAsync: () => Promise.reject(new Error(KEYCHAIN_LOCKED)),
    setItemAsync: () => Promise.reject(new Error(KEYCHAIN_LOCKED)),
    deleteItemAsync: () => Promise.reject(new Error(KEYCHAIN_LOCKED))
}));

describe('generic/runtime-edge-error-message', () => {
    it.effect.each([
        { action: 'reading the PIN', effect: Effect.flatMap(AuthService, authService => authService.ensurePinBackgroundAccessibility()) },
        { action: 'saving the PIN', effect: Effect.flatMap(AuthService, authService => authService.persistPin('1234')) },
        { action: 'clearing the PIN', effect: Effect.flatMap(AuthService, authService => authService.persistPin(null)) }
    ])('keeps the native message when $action fails at the runtime edge', ({ effect }) =>
        Effect.gen(function* () {
            const exit = yield* Effect.exit(effect);

            expect(Exit.isFailure(exit) ? getErrorMessage(Cause.squash(exit.cause)) : null).toBe(KEYCHAIN_LOCKED);
        }).pipe(Effect.provide(TestLayer))
    );
});
