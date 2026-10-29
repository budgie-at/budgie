import { CategorizeInboxLabelKindEnum, CategorizeInboxService } from '@budgie/categorization';
import { TagSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { toCategorizeInboxTransactionIds } from '../utils/to-categorize-inbox-transaction-ids.util';

import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';
import type { Dispatch, SetStateAction } from 'react';

export const useCategorizeInboxLastWrite = (
    strategy: CategorizeInboxStrategyInterface,
    visibility: Pick<CategorizeInboxVisibilityInterface, 'showTransactions'>,
    enqueueWrite: CategorizeInboxEnqueueWriteType,
    setLastWrite: Dispatch<SetStateAction<CategorizeInboxLastWriteInterface | null>>
) => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();

    const undo = (write: CategorizeInboxLastWriteInterface): void => {
        setLastWrite(null);
        visibility.showTransactions(toCategorizeInboxTransactionIds(write.assignments));
        enqueueWrite(
            Effect.gen(function* () {
                const categorizeInboxService = yield* CategorizeInboxService;
                if (isNotEmptyArray(write.followUpAssignments)) {
                    yield* categorizeInboxService.undo(CategorizeInboxLabelKindEnum.TAG, write.followUpAssignments);
                }

                yield* categorizeInboxService.undo(strategy.labelKind, write.assignments);
            }),
            () => void setLastWrite(previous => previous ?? write),
            strategy.writeFailed
        );
    };

    const applyFollowUp = (write: CategorizeInboxLastWriteInterface): void => {
        strategy.pickFollowUpTagIds?.(write.assignments[0], tagIds => {
            if (isNotEmptyArray(tagIds)) {
                enqueueWrite(
                    Effect.gen(function* () {
                        const categorizeInboxService = yield* CategorizeInboxService;
                        const followUpAssignments = yield* categorizeInboxService.assign(
                            CategorizeInboxLabelKindEnum.TAG,
                            tagIds.map(labelId => ({ ...write.assignments[0], labelId })),
                            TagSourceEnum.USER
                        );

                        setLastWrite(previous => (previous === write ? { ...write, followUpAssignments } : previous));
                        hapticNotification(NotificationFeedbackType.Success);
                    }),
                    emptyFn,
                    t`Could not tag transactions`
                );
            }
        });
    };

    return { undo, applyFollowUp };
};
