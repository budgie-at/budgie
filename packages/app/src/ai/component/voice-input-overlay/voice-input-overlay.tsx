import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useVoiceReviewModal } from '../../context/voice-review-modal.context';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

interface Props {
    readonly onClose: () => void;
}

export const VoiceInputOverlay = ({ onClose }: Props) => {
    const [openVoiceReview] = useVoiceReviewModal();

    const hasAutoStartedRef = useRef(false);
    const contentOpacity = useSharedValue(1);

    const voiceInput = useVoiceInput();
    const { isReady, start } = voiceInput;

    useEffect(() => {
        if (isReady && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            start();
        }
    }, [isReady, start]);

    useEffect(
        () => () => {
            voiceInput.cancel();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Cancel only on unmount; capturing voiceInput.cancel each render would re-fire the cleanup
        []
    );

    const handleConfirm = async () => {
        const originalText = voiceInput.data.transcription.committed;
        const transactions = await voiceInput.confirmAndCategorize();

        if (!isNotEmptyArray(transactions)) {
            onClose();

            return;
        }

        const result = await openVoiceReview({ transactions, originalText });

        if (result === 're-record') {
            voiceInput.start();

            return;
        }

        onClose();
    };

    const handleRecord = () => {
        switch (voiceInput.state) {
            case 'recording':
                voiceInput.stop();
                break;
            case 'confirming':
                void handleConfirm();
                break;
            case 'idle':
            case 'error':
                voiceInput.start();
                break;
            default:
                break;
        }
    };

    const handleCancel = () => {
        voiceInput.cancel();
        onClose();
    };

    return (
        <VoiceInputOverlayContent voiceInput={voiceInput} contentOpacity={contentOpacity} onRecord={handleRecord} onCancel={handleCancel} />
    );
};
