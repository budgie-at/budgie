import * as Effect from 'effect/Effect';
import { useRef } from 'react';
import { AppState } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { AuthService } from '../service/auth.service';

import type * as Fiber from 'effect/Fiber';

interface Attempt {
    readonly fiber: Fiber.Fiber<void>;
    readonly isPinAttempt: boolean;
}

const waitUntilAppActive = Effect.callback<true>(resume => {
    if (AppState.currentState === 'active') {
        resume(Effect.succeed(true));

        return;
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
            resume(Effect.succeed(true));
        }
    });

    return Effect.sync(() => void subscription.remove());
});

export const useAuthAttempt = () => {
    const attemptRef = useRef<Attempt | null>(null);
    const isBiometricPromptOpenRef = useRef(false);

    const isInFlight = () => isDefined(attemptRef.current) && !isDefined(attemptRef.current.fiber.pollUnsafe());

    const start = (
        verification: Effect.Effect<boolean, unknown, AuthService>,
        isPinAttempt: boolean,
        accept: (success: boolean) => void
    ) => {
        attemptRef.current?.fiber.interruptUnsafe();
        attemptRef.current = {
            isPinAttempt,
            fiber: appRuntime.runFork(
                verification.pipe(
                    Effect.tapError(Effect.logError),
                    Effect.orElseSucceed(() => false),
                    Effect.tap(() => waitUntilAppActive),
                    Effect.flatMap(success => Effect.sync(() => void accept(success)))
                )
            )
        };
    };

    const startPinAttempt = (pin: string, accept: (success: boolean) => void) => {
        start(
            Effect.flatMap(AuthService, authService => authService.verifyPin(pin)),
            true,
            accept
        );
    };

    const startBiometricAttempt = (accept: (success: boolean) => void) => {
        if (isInFlight() || isBiometricPromptOpenRef.current) {
            return false;
        }

        isBiometricPromptOpenRef.current = true;
        start(
            Effect.flatMap(AuthService, authService => authService.authenticateWithBiometrics()).pipe(
                Effect.uninterruptible,
                Effect.ensuring(
                    Effect.sync(() => {
                        isBiometricPromptOpenRef.current = false;
                    })
                )
            ),
            false,
            accept
        );

        return true;
    };

    const invalidate = () => {
        const shouldClearPinInput = isInFlight() && attemptRef.current?.isPinAttempt === true;

        attemptRef.current?.fiber.interruptUnsafe();
        attemptRef.current = null;

        return shouldClearPinInput;
    };

    return { invalidate, startBiometricAttempt, startPinAttempt };
};
