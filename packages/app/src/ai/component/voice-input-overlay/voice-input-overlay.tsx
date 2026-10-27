import { type AITransactionInterface } from '@budgie/ai';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useVoiceReviewModal } from '../../context/voice-review-modal.context';
import { VoiceInputStateEnum } from '../../enum/voice-input-state.enum';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

import type { VoiceReviewModalResult } from '../../context/voice-review-modal.context';

export const VoiceInputOverlay = ({ onClose }: { readonly onClose: () => void }) => {
    const [openVoiceReview] = useVoiceReviewModal();
    const voiceInput = useVoiceInput();
    const contentOpacity = useSharedValue(1);

    const isLiveRef = useRef<boolean>(true);
    const { isReady, startAndCollect, cancel, state, stop } = voiceInput;

    useEffect(() => {
        if (!isReady) {
            return emptyFn;
        }

        isLiveRef.current = true;

        const runOnce = (): void => {
            const handleReviewResult = (result: VoiceReviewModalResult): void => {
                if (!isLiveRef.current) {
                    return;
                }
                if (result.kind === 're-record') {
                    runOnce();

                    return;
                }
                if (result.kind === 'saved' && isNotEmptyArray(result.transactionIds)) {
                    const hasSingleSavedTransaction = result.transactionIds.length === 1;
                    onClose();
                    if (hasSingleSavedTransaction) {
                        router.push({ pathname: '/transactions/[id]/expense', params: { id: String(result.transactionIds[0]) } });

                        return;
                    }
                    router.push({ pathname: '/account/[id]/details', params: { id: String(result.accountId) } });

                    return;
                }
                onClose();
            };

            const handleCollected = (transactions: AITransactionInterface[], originalText: string): void => {
                if (!isLiveRef.current) {
                    return;
                }
                if (!isNotEmptyArray(transactions)) {
                    onClose();

                    return;
                }
                openVoiceReview({ transactions, originalText }, handleReviewResult);
            };

            appRuntime.runFork(
                startAndCollect(handleCollected).pipe(
                    Effect.tapCause(Effect.logError),
                    Effect.catchCause(() =>
                        Effect.sync(() => {
                            if (isLiveRef.current) {
                                onClose();
                            }
                        })
                    )
                )
            );
        };

        runOnce();

        return () => {
            isLiveRef.current = false;
            cancel();
        };
        // oxlint-disable-next-line react/exhaustive-deps -- Single mount-bound lifecycle: starts when ready, recurses on re-record, cancels on unmount
    }, [isReady]);

    const handleRecord = () => {
        if (state === VoiceInputStateEnum.RECORDING) {
            stop();
        }
    };

    const handleCancel = () => {
        cancel();
        onClose();
    };

    return (
        <VoiceInputOverlayContent voiceInput={voiceInput} contentOpacity={contentOpacity} onRecord={handleRecord} onCancel={handleCancel} />
    );
};
