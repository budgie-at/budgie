import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { AudioManager } from 'react-native-audio-api';
import { LLAMA3_2_1B, WHISPER_TINY, getStructuredOutputPrompt, useLLM, useSpeechToText } from 'react-native-executorch';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../@generic/components/button/button';
import { Page } from '../@generic/components/page/page';
import { AiTransactionSchema } from '../ai/schema/ai-transaction.schema';
import { recordVoice } from '../ai/util/record-voice.util';
import { useAllCategoriesQuery } from '../category/query/use-all-categories.query';

// eslint-disable-next-line lingui/no-unlocalized-strings
const systemPrompt = `Your goal is to analyze and parse user message and return them in JSON format. Don't respond to user. Simply return JSON with user's question parsed.`;

// TODO: Add support for different languages based on user settings
// eslint-disable-next-line max-lines-per-function
export default function AiScreen() {
    const { t } = useLingui();

    const llm = useLLM({ model: LLAMA3_2_1B });

    const speechToText = useSpeechToText({ model: WHISPER_TINY });

    const [isRecording, setIsRecording] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');
    const [formattingInstructions, setFormattingInstructions] = useState('');

    const waveformRef = useRef<number[]>([]);

    useAllCategoriesQuery(categories => {
        AiTransactionSchema.properties.category.enum = categories.map(category => category.title);
        setFormattingInstructions(getStructuredOutputPrompt(AiTransactionSchema));
    });

    useEffect(() => {
        const setup = async () => {
            await AudioManager.requestRecordingPermissions();
            AudioManager.setAudioSessionOptions({
                iosCategory: 'playAndRecord',
                iosMode: 'spokenAudio',
                iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP']
            });
        };

        void setup();
    }, []);

    const handlePress = async () => {
        setError('');
        setIsRecording(true);

        waveformRef.current = [];
        await recordVoice(async waveform => {
            waveformRef.current.push(...waveform);
        });

        const transcribed = await speechToText.transcribe(waveformRef.current, { language: 'en' }).catch(() => '');

        setPrompt(transcribed);

        if (isNotEmptyString(transcribed)) {
            try {
                await llm.generate([
                    { role: 'system', content: `${systemPrompt}\n${formattingInstructions}` },
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
    const buttonText = isRecording ? t`Recording...` : t`Press and describe your transaction`;

    return (
        <Page>
            <ScrollView>
                {areModelsReady ? (
                    <>
                        {isGenerating ? (
                            <ActivityIndicator size="large" className="bg-primary-reverse" />
                        ) : (
                            <Button onPress={handlePress} content={buttonText}></Button>
                        )}
                    </>
                ) : (
                    <>
                        <ActivityIndicator size="large" className="bg-primary-reverse" />
                        <View className="w-full px-4 mt-4">
                            <Text className="text-primary text-center mt-2">
                                {t`Downloading model...`} {Math.round(llm.downloadProgress * 100)}%
                            </Text>
                        </View>
                    </>
                )}

                <>
                    <Text className="text-primary text-3xl font-semibold">
                        <Trans>Prompt:</Trans>
                    </Text>
                    <Text className="text-primary text-3xl">{prompt}</Text>
                </>

                <>
                    <Text className="text-primary text-3xl font-semibold">
                        <Trans>Structured:</Trans>
                    </Text>
                    <Text className="text-primary text-3xl">{llm.response}</Text>
                </>

                {isNotEmptyString(error) && <Text className="text-primary text-3xl font-semibold">{error}</Text>}
            </ScrollView>
        </Page>
    );
}
