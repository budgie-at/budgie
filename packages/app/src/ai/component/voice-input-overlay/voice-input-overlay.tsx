import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { AITransactionInterface } from '../../interface/ai-transaction.interface';
import { buildExpenseUrl } from '../../util/build-expense-url.util';

import { VoiceInputOverlayContent } from './voice-input-overlay-content';

const EXIT_DURATION = 100;

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export const VoiceInputOverlay = ({ isOpen, onClose }: Props) => {
    const { defaultAccount } = useSettingsContext();

    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const hasAutoStartedRef = useRef(false);
    const contentOpacity = useSharedValue(isOpen ? 1 : 0);

    const handleDone = (transaction: AITransactionInterface) => {
        const url = buildExpenseUrl(transaction, defaultAccount?.id);
        onClose();
        router.push(url);
    };

    const voiceInput = useVoiceInput({ onDone: handleDone });

    useAnimatedReaction(
        () => isOpen,
        (current, previous) => {
            if (current && !previous) {
                contentOpacity.value = 1;
            } else if (!current && previous) {
                runOnJS(setIsAnimatingOut)(true);
                runOnJS(voiceInput.cancel)();
                contentOpacity.value = withTiming(0, { duration: EXIT_DURATION }, finished => {
                    if (finished) {
                        runOnJS(setIsAnimatingOut)(false);
                    }
                });
            }
        },
        [isOpen]
    );

    useEffect(() => {
        if (isOpen && voiceInput.isReady && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            voiceInput.start();
        }
        if (!isOpen) {
            hasAutoStartedRef.current = false;
        }
    }, [isOpen, voiceInput.isReady, voiceInput.start]);

    const handleRecord = () => {
        switch (voiceInput.state) {
            case 'recording':
                voiceInput.stop();
                break;
            case 'confirming':
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

    const isVisible = isOpen || isAnimatingOut;
    if (!isVisible) {
        return null;
    }

    return (
        <VoiceInputOverlayContent voiceInput={voiceInput} contentOpacity={contentOpacity} onRecord={handleRecord} onCancel={handleCancel} />
    );
};
