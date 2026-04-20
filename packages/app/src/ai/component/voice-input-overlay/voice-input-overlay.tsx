import { AITransactionInterface, groupVoiceTransactions } from '@budgie/ai';
import { router } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { buildExpenseUrl } from '../../utils/build-expense-url.util';
import { VoiceInputOverlayContent } from '../voice-input-overlay-content/voice-input-overlay-content';

interface Props {
    readonly onClose: () => void;
}

export const VoiceInputOverlay = ({ onClose }: Props) => {
    const { defaultAccount } = useSettingsContext();

    const hasAutoStartedRef = useRef(false);
    const originalTextRef = useRef('');
    const contentOpacity = useSharedValue(1);

    const handleDone = (transactions: AITransactionInterface[]) => {
        if (!isNotEmptyArray(transactions)) {
            return;
        }

        const groupedTransaction = groupVoiceTransactions(transactions, originalTextRef.current);
        if (!isDefined(groupedTransaction)) {
            return;
        }

        const url = buildExpenseUrl(groupedTransaction, defaultAccount?.id);
        onClose();
        router.push(url);
    };

    const voiceInput = useVoiceInput({ onDone: handleDone });
    const { isReady, start } = voiceInput;

    const voiceInputRef = useRef(voiceInput);

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
            voiceInputRef.current.cancel();
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
