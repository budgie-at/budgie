import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';

export const useCategorizeInboxWriteQueue = (): CategorizeInboxEnqueueWriteType => {
    const [hapticNotification] = useVibration();
    const [writeSemaphore] = useState(() => Semaphore.makeUnsafe(1));

    return (write, rollback, failedMessage) => {
        appRuntime.runFork(
            writeSemaphore.withPermit(write).pipe(
                Effect.catchCause(cause =>
                    Effect.sync(() => {
                        rollback();
                        hapticNotification(NotificationFeedbackType.Error);
                        showErrorToast(failedMessage, getErrorMessage(Cause.squash(cause)));
                    })
                )
            )
        );
    };
};
