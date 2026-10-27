import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';
import * as Stream from 'effect/Stream';

import { isPositiveNumber } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { PinAttemptService } from '../service/pin-attempt.service';

export const pinLockoutRemainingMillisAtom = appAtomRuntime.atom(
    Stream.unwrap(
        Effect.map(PinAttemptService, pinAttemptService =>
            Stream.fromEffectSchedule(pinAttemptService.getRemainingLockoutMillis(), Schedule.spaced(Duration.seconds(1))).pipe(
                Stream.takeUntil(remainingMillis => !isPositiveNumber(remainingMillis))
            )
        )
    )
);
