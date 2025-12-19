import { Trans, useLingui } from '@lingui/react/macro';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Page } from '../@generic/components/page/page';
import { RecordButton } from '../ai/component/record-button/record-button';
import { useLlmContext } from '../ai/context/llm.context';
import { useAudioManager } from '../ai/hook/use-audio-manager.hook';
import { useTransactionInfoPrompt } from '../ai/hook/use-transaction-info-prompt.hook';
import { recordVoice } from '../ai/util/record-voice.util';
import { useLocaleInfo } from '../i18n/hook/use-locale-info.hook';
import { CreateExpenseTransaction } from '../transaction/components/create-expense-transaction/create-expense-transaction';

export default function AiScreen() {
    const { t } = useLingui();

    const { llm, speechToText } = useLlmContext();
    const locale = useLocaleInfo();

    const [isRecording, setIsRecording] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');

    const waveformRef = useRef<number[]>([]);

    useAudioManager();
    const [systemPrompt, transactionInfo, resetTransactionInfo] = useTransactionInfoPrompt(llm, prompt);

    // eslint-disable-next-line max-statements
    const handlePress = async () => {
        setError('');
        setIsRecording(true);
        resetTransactionInfo();

        waveformRef.current = [];
        await recordVoice(async waveform => {
            waveformRef.current.push(...waveform);
        });

        const transcribed = (
            await speechToText.transcribe(waveformRef.current, { language: locale.languageCode as SpeechToTextLanguage }).catch(() => '')
        ).trim();

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

        setIsRecording(false);
    };

    const areModelsReady = speechToText.isReady && llm.isReady;
    const isGenerating = speechToText.isGenerating || llm.isGenerating;

    const scrollViewContentStyle = useMemo(() => ({ paddingBottom: 120 }), []);

    return (
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

                {isDefined(transactionInfo) && (
                    <CreateExpenseTransaction categoryId={transactionInfo.categoryId} amount={transactionInfo.amount} />
                )}
            </ScrollView>

            <View className="absolute bottom-8 left-0 right-0 items-center">
                <RecordButton
                    isReady={areModelsReady}
                    isRecording={isRecording}
                    isProcessing={isGenerating}
                    downloadProgress={llm.downloadProgress}
                    onPress={handlePress}
                />
            </View>
        </Page>
    );
}
