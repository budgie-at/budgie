import { AITransactionInterface } from '@budgie/ai';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useVoiceReviewModal } from '../../context/voice-review-modal.context';
import { UseVoiceInputReturn, useVoiceInput } from '../../hook/use-voice-input.hook';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

interface Props {
    readonly onClose: () => void;
}

export const VoiceInputOverlay = ({ onClose }: Props) => {
    const [openVoiceReview] = useVoiceReviewModal();

    const hasAutoStartedRef = useRef(false);
    const originalTextRef = useRef('');
    const voiceInputRef = useRef<UseVoiceInputReturn | null>(null);
    const contentOpacity = useSharedValue(1);

    const handleDone = (transactions: AITransactionInterface[]): void => {
        if (!isNotEmptyArray(transactions)) {
            return;
        }

        const handleResult = (result: 'saved' | 're-record' | 'cancelled'): void => {
            if (result === 're-record') {
                voiceInputRef.current?.start();

                return;
            }
            onClose();
        };

        void openVoiceReview({ transactions, originalText: originalTextRef.current }).then(handleResult, () => void onClose());
    };

    const voiceInput = useVoiceInput({ onDone: handleDone });
    const { isReady, start } = voiceInput;

    useLayoutEffect(() => {
        voiceInputRef.current = voiceInput;
    });

    useEffect(() => {
        if (isReady && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            start();
        }
    }, [isReady, start]);

    useEffect(
        () => () => {
            voiceInputRef.current?.cancel();
        },
        []
    );

    const handleRecord = () => {
        switch (voiceInput.state) {
            case 'recording':
                voiceInput.stop();
                break;
            case 'confirming':
                originalTextRef.current = voiceInput.data.transcription.committed;
                voiceInput.confirm();
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
