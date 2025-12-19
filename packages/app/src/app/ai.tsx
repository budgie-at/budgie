import { Trans, useLingui } from '@lingui/react/macro';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Page } from '../@generic/components/page/page';
import { RecordButton } from '../ai/component/record-button/record-button';
import { useAudioManager } from '../ai/hook/use-audio-manager.hook';
import { useLlm } from '../ai/hook/use-llm.hook';
import { getSystemPrompt } from '../ai/util/get-system-prompt.util';
import { recordVoice } from '../ai/util/record-voice.util';
import { useAllCategoriesQuery } from '../category/query/use-all-categories.query';
import { useLocaleInfo } from '../i18n/hook/use-locale-info.hook';

export default function AiScreen() {
    const { t } = useLingui();

    const [llm, speechToText] = useLlm();
    const locale = useLocaleInfo();

    const [isRecording, setIsRecording] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');

    const waveformRef = useRef<number[]>([]);

    useAudioManager();
    useAllCategoriesQuery(categories => void setSystemPrompt(getSystemPrompt(categories)));

    const handlePress = async () => {
        setError('');
        setIsRecording(true);

        waveformRef.current = [];
        await recordVoice(async waveform => {
            waveformRef.current.push(...waveform);
        });

        const transcribed = await speechToText
            .transcribe(waveformRef.current, { language: locale.languageCode as SpeechToTextLanguage })
            .catch(() => '');

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

                {isNotEmptyString(llm.response) && (
                    <View className="mt-4 p-4 bg-secondary rounded-2xl">
                        <Text className="text-secondary text-sm font-medium mb-2">
                            <Trans>Parsed transaction:</Trans>
                        </Text>
                        <Text className="text-primary text-base">{llm.response}</Text>
                    </View>
                )}

                {isNotEmptyString(error) && (
                    <View className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                        <Text className="text-red-600 dark:text-red-400 text-base">{error}</Text>
                    </View>
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
