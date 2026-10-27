import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Schedule from 'effect/Schedule';
import * as Stream from 'effect/Stream';
import { useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { PinAttemptService } from '../service/pin-attempt.service';
import { formatPinLockoutTime } from '../utils/format-pin-lockout-time.util';

const pinLockoutRemainingMillisAtom = appAtomRuntime.atom(
    Stream.unwrap(
        Effect.map(PinAttemptService, pinAttemptService =>
            Stream.fromEffectSchedule(pinAttemptService.getRemainingLockoutMillis(), Schedule.spaced(Duration.seconds(1))).pipe(
                Stream.takeUntil(remainingMillis => !isPositiveNumber(remainingMillis))
            )
        )
    )
);

export const usePinError = () => {
    const { t } = useLingui();
    const [error, setError] = useState<string | null>(null);
    const remainingMillis = AsyncResult.getOrElse(useAtomValue(pinLockoutRemainingMillisAtom), () => 0);
    const refreshLockout = useAtomRefresh(pinLockoutRemainingMillisAtom);
    const isLockedOut = isPositiveNumber(remainingMillis);
    const time = formatPinLockoutTime(remainingMillis);

    return {
        clearError: () => void setError(null),
        error: isLockedOut ? t`Too many attempts. Try again in ${time}` : error,
        isLockedOut,
        reportIncorrectPin: () => {
            setError(t`Incorrect PIN`);
            refreshLockout();
        }
    };
};
