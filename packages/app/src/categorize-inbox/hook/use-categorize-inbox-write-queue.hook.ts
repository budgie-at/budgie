import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';

export const useCategorizeInboxWriteQueue = (): CategorizeInboxEnqueueWriteType => {
    const [hapticNotification] = useVibration();
    const writeQueueRef = useRef(Promise.resolve());

    return (write, rollback, failedMessage) => {
        writeQueueRef.current = writeQueueRef.current.then(write).catch((error: unknown) => {
            rollback();
            hapticNotification(NotificationFeedbackType.Error);
            showErrorToast(failedMessage, getErrorMessage(error));
        });
    };
};
