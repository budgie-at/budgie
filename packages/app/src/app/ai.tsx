import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { SMOLLM2_1_135M, WHISPER_TINY, getStructuredOutputPrompt, useLLM, useSpeechToText } from 'react-native-executorch';

import { Button } from '../@generic/components/button/button';
import { Page } from '../@generic/components/page/page';

const TransactionSchema = {
    properties: {
        category: {
            type: 'string',
            // eslint-disable-next-line lingui/no-unlocalized-strings
            description: 'Transaction category.'
        },
        type: {
            type: 'string',
            enum: ['expense', 'income'],
            // eslint-disable-next-line lingui/no-unlocalized-strings
            description: 'Transaction type.'
        },
        amount: {
            type: 'number',
            // eslint-disable-next-line lingui/no-unlocalized-strings
            description: 'Amount of money, that user spent.'
        }
    },
    required: ['category', 'type', 'amount']
};

const recordVoice = async (onRecorder: (waveform: number[]) => Promise<void>, durationSeconds = 3, sampleRate = 16000) => {
    const recorder = new AudioRecorder({ sampleRate, bufferLengthInSamples: 4096 });

    recorder.onAudioReady(({ buffer }) => {
        void onRecorder(Array.from(buffer.getChannelData(0)));
    });

    recorder.start();
    await new Promise(resolve => {
        setTimeout(resolve, durationSeconds * 1000);
    });
    recorder.stop();
};

export default function AiScreen() {
    const { t } = useLingui();

    const llm = useLLM({ model: SMOLLM2_1_135M });
    const speechToText = useSpeechToText({ model: WHISPER_TINY });

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

    const [isRecording, setIsRecording] = useState(false);
    const [prompt, setPrompt] = useState('');
    const waveformRef = useRef<number[]>([]);

    const handlePress = async () => {
        setIsRecording(true);

        waveformRef.current = [];
        await recordVoice(async waveform => {
            waveformRef.current.push(...waveform);
        });

        const formattingInstructions = getStructuredOutputPrompt(TransactionSchema);
        const transcribed = await speechToText.transcribe(waveformRef.current, { language: 'en' });

        await llm.generate([
            {
                role: 'system',
                // eslint-disable-next-line lingui/no-unlocalized-strings
                content: `Your goal is to parse user's messages and return them in JSON format. Don't respond to user. Simply return JSON with user's question parsed. \n${formattingInstructions}\n /no_think`
            },
            { role: 'user', content: transcribed }
        ]);

        setIsRecording(false);
        setPrompt(transcribed);
    };

    const areModelsReady = speechToText.isReady && llm.isReady;
    const isGenerating = speechToText.isGenerating || llm.isGenerating;
    const buttonText = isRecording ? t`Recording...` : t`Press and describe your transaction`;

    return (
        <Page>
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
            <Text className="text-primary text-3xl font-semibold">{prompt}</Text>
            <Text className="text-primary text-3xl font-semibold">{llm.response}</Text>
        </Page>
    );
}
