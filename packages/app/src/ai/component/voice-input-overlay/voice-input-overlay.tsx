import { AITransactionInterface } from '@budgie/ai';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useVoiceReviewModal } from '../../context/voice-review-modal.context';
import { VoiceInputStateEnum } from '../../enum/voice-input-state.enum';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

interface CollectedVoiceInputInterface {
    readonly transactions: AITransactionInterface[];
    readonly originalText: string;
}

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

        // eslint-disable-next-line max-statements -- Single async lifecycle: collect, route on result kind, recurse on re-record
        const runOnce = async (): Promise<void> => {
            const collected = await new Promise<CollectedVoiceInputInterface | null>(resolve => {
                startAndCollect((transactions, originalText) => void resolve({ transactions, originalText }));
            });
            if (!isLiveRef.current) {
                return;
            }
            if (!isDefined(collected) || !isNotEmptyArray(collected.transactions)) {
                onClose();

                return;
            }
            const result = await openVoiceReview({ transactions: collected.transactions, originalText: collected.originalText });
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Ref value can flip during the awaited modal flow; analyzer can't see across async boundary
            if (!isLiveRef.current) {
                return;
            }
            if (result.kind === 're-record') {
                await runOnce();

                return;
            }
            if (result.kind === 'saved' && isNotEmptyArray(result.transactionIds)) {
                const hasSingleSavedTransaction = result.transactionIds.length === 1;
                onClose();
                if (hasSingleSavedTransaction) {
                    router.push(`/transactions/${result.transactionIds[0]}/expense`);

                    return;
                }
                router.push(`/account/${result.accountId}/details`);

                return;
            }
            onClose();
        };

        void runOnce();

        return () => {
            isLiveRef.current = false;
            cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Single mount-bound lifecycle: starts when ready, recurses on re-record, cancels on unmount
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
