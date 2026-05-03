import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { useVoiceReviewModal } from '../../context/voice-review-modal.context';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

interface Props {
    readonly onClose: () => void;
}

export const VoiceInputOverlay = ({ onClose }: Props) => {
    const [openVoiceReview] = useVoiceReviewModal();
    const voiceInput = useVoiceInput();
    const contentOpacity = useSharedValue(1);

    const isLiveRef = useRef<boolean>(true);
    const { isReady, startAndCollect, cancel, state, stop, data } = voiceInput;

    useEffect(() => {
        if (!isReady) {
            return emptyFn;
        }

        isLiveRef.current = true;

        // eslint-disable-next-line max-statements -- Single async lifecycle: collect, route on result kind, recurse on re-record
        const runOnce = async (): Promise<void> => {
            const transactions = await startAndCollect().catch(() => null);
            if (!isLiveRef.current) {
                return;
            }
            if (transactions === null || !isNotEmptyArray(transactions)) {
                onClose();

                return;
            }
            const result = await openVoiceReview({ transactions, originalText: data.transcription.committed });
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Ref value can flip during the awaited modal flow; analyzer can't see across async boundary
            if (!isLiveRef.current) {
                return;
            }
            if (result.kind === 're-record') {
                await runOnce();

                return;
            }
            if (result.kind === 'saved' && isNotEmptyArray(result.transactionIds)) {
                onClose();
                router.push(`/transactions/${result.transactionIds[0]}/expense`);

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
        if (state === 'recording') {
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
