import { useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';
import { useEffect, useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { PinAttemptService } from '../service/pin-attempt.service';
import { formatPinLockoutTime } from '../util/format-pin-lockout-time.util';

const readRemainingLockoutMillis = (onRead: (remainingMillis: number) => void) =>
    Effect.flatMap(PinAttemptService, pinAttemptService => pinAttemptService.getRemainingLockoutMillis()).pipe(
        Effect.tap(remainingMillis => Effect.sync(() => void onRead(remainingMillis)))
    );

export const usePinError = () => {
    const { t } = useLingui();
    const [error, setError] = useState<string | null>(null);
    const [remainingMillis, setRemainingMillis] = useState(0);
    const isLockedOut = isPositiveNumber(remainingMillis);

    useEffect(() => {
        const lockoutFiber = appRuntime.runFork(
            readRemainingLockoutMillis(setRemainingMillis).pipe(
                Effect.repeat({ schedule: Schedule.spaced(Duration.seconds(1)), while: isPositiveNumber })
            )
        );

        return () => void lockoutFiber.interruptUnsafe();
    }, [isLockedOut]);

    const time = formatPinLockoutTime(remainingMillis);

    return {
        clearError: () => void setError(null),
        error: isLockedOut ? t`Too many attempts. Try again in ${time}` : error,
        isLockedOut,
        reportIncorrectPin: () => {
            setError(t`Incorrect PIN`);
            appRuntime.runFork(readRemainingLockoutMillis(setRemainingMillis));
        }
    };
};
