import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../@generic/components/page/page';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { RecordButton } from '../ai/component/record-button/record-button';
import { useLlmContext } from '../ai/context/llm.context';
import { useAiTransaction } from '../ai/hook/use-ai-transaction.hook';
import { useAudioManager } from '../ai/hook/use-audio-manager.hook';
import { calculateRMS } from '../ai/util/calculate-rms.util';
import { useLocaleInfo } from '../i18n/hook/use-locale-info.hook';
import { AiTransactionPreviewCard } from '../transaction/components/ai-transaction-preview-card/ai-transaction-preview-card';
import { useCreateExpenseTransactionMutation } from '../transaction/hook/use-create-expense-transaction.mutation';

const SAMPLE_RATE = 16000;
const SILENCE_TIMEOUT = 2000;
const SILENCE_THRESHOLD = 0.01;

// eslint-disable-next-line max-lines-per-function
export default function AiScreen() {
    const { t } = useLingui();

    const { llm, speechToText } = useLlmContext();
    const locale = useLocaleInfo();

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');

    const recorderRef = useRef(new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: 4096 }));
    const waveformRef = useRef<number[]>([]);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAudioManager();
    const [systemPrompt, transactionInfo, resetTransaction, setTransactionCategory] = useAiTransaction(llm, prompt);
    const createExpense = useCreateExpenseTransactionMutation();

    const handleConfirm = async () => {
        if (isPositiveNumber(transactionInfo?.amount)) {
            await createExpense(transactionInfo.amount, transactionInfo.category?.id ?? 0);
            resetTransaction();
        }
    };

    const handleCancel = () => {
        resetTransaction();
        setPrompt('');
    };

    // eslint-disable-next-line max-statements
    const handleStopRecording = async () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        recorderRef.current.stop();

        setIsProcessingVoice(true);
        setIsRecording(false);

        // HINT: We need time for AudioRecorder to process the audio data, would be nice to have event there
        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

        const transcribed = (
            await speechToText.transcribe(waveformRef.current, { language: locale.languageCode as SpeechToTextLanguage }).catch(() => '')
        ).trim();

        setIsProcessingVoice(false);
        setPrompt(transcribed);

        if (isNotEmptyString(transcribed)) {
            try {
                await llm.generate([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: transcribed }
                ]);
            } catch (e: unknown) {
                setError(getErrorMessage(e));
            }
        } else {
            setError(t`No speech detected`);
        }
    };

    const handleStartRecording = () => {
        setError('');
        setPrompt('');
        setIsRecording(true);
        resetTransaction();

        waveformRef.current = [];
        recorderRef.current.start();
        silenceTimeoutRef.current = setTimeout(() => void handleStopRecording(), SILENCE_TIMEOUT);
    };

    const handlePress = () => {
        if (isRecording) {
            void handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

    useEffect(() => {
        recorderRef.current.onAudioReady(({ buffer }) => {
            const samples = buffer.getChannelData(0);

            if (calculateRMS(samples) > SILENCE_THRESHOLD) {
                waveformRef.current.push(...Array.from(samples));

                if (silenceTimeoutRef.current) {
                    clearTimeout(silenceTimeoutRef.current);
                }

                silenceTimeoutRef.current = setTimeout(() => void handleStopRecording(), SILENCE_TIMEOUT);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => () => {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
        },
        []
    );

    const scrollViewContentStyle = useMemo(() => ({ paddingBottom: 120 }), []);
    const isGenerating = llm.isGenerating || speechToText.isGenerating || isProcessingVoice;

    return (
        <BottomSheetsProvider>
            <Page>
                <ScrollView className="flex-1 px-4" contentContainerStyle={scrollViewContentStyle}>
                    {isNotEmptyString(prompt) && (
                        <View className="mt-4 p-4 bg-secondary rounded-2xl">
                            <Text className="text-secondary text-sm font-medium mb-2">
                                <Trans>Your message:</Trans>
                            </Text>
                            <Text className="text-primary text-base">{prompt}</Text>
                        </View>
                    )}

                    {isNotEmptyString(error) && (
                        <View className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                            <Text className="text-red-600 dark:text-red-400 text-base">{error}</Text>
                        </View>
                    )}

                    {isDefined(transactionInfo) && isPositiveNumber(transactionInfo.amount) && (
                        <AiTransactionPreviewCard
                            amount={transactionInfo.amount}
                            category={transactionInfo.category}
                            type={transactionInfo.type}
                            onConfirm={handleConfirm}
                            onCancel={handleCancel}
                            onCategoryChange={setTransactionCategory}
                        />
                    )}
                </ScrollView>

                <View className="absolute bottom-8 left-0 right-0 items-center">
                    <RecordButton llm={llm} isGenerating={isGenerating} isRecording={isRecording} onPress={handlePress} />
                </View>
            </Page>
        </BottomSheetsProvider>
    );
}
