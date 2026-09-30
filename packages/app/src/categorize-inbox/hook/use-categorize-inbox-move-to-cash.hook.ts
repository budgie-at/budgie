import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxMoveToCashInterface } from '../interface/categorize-inbox-move-to-cash.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';

export const useCategorizeInboxMoveToCash = (
    visibility: Pick<CategorizeInboxVisibilityInterface, 'hideTransactions' | 'showTransactions'>,
    enqueueWrite: CategorizeInboxEnqueueWriteType,
    setLastWrite: (lastWrite: CategorizeInboxLastWriteInterface | null) => void
): CategorizeInboxMoveToCashInterface => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const [movedToCashTransactionIds, setMovedToCashTransactionIds] = useState<number[]>([]);

    const moveToCash = (transactionIds: number[]): void => {
        visibility.hideTransactions(transactionIds);
        enqueueWrite(
            async () => {
                const movedTransactionIds = await appRuntime.runPromise(categorizeInboxService.moveToCash(transactionIds));

                if (isNotEmptyArray(movedTransactionIds)) {
                    setLastWrite(null);
                    setMovedToCashTransactionIds(movedTransactionIds);
                    hapticNotification(NotificationFeedbackType.Success);
                }
            },
            () => void visibility.showTransactions(transactionIds),
            t`Could not move withdrawals to cash`
        );
    };

    const undoMoveToCash = (transactionIds: number[]): void => {
        setMovedToCashTransactionIds([]);
        visibility.showTransactions(transactionIds);
        enqueueWrite(
            () => appRuntime.runPromise(categorizeInboxService.undoMoveToCash(transactionIds)),
            () => void setMovedToCashTransactionIds(previous => (isNotEmptyArray(previous) ? previous : transactionIds)),
            t`Could not undo the move to cash`
        );
    };

    return {
        movedToCashTransactionIds,
        moveToCash,
        undoMoveToCash,
        resetMovedToCash: () => void setMovedToCashTransactionIds([])
    };
};
