import { useEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { useLlmContext } from '../context/llm.context';
import { calculateRMS } from '../util/calculate-rms.util';

import { useAudioManager } from './use-audio-manager.hook';

export const useTranscribe = (
    onComplete: (transcribed: string) => Promise<void>,
    silenceTimeoutMs = 2000,
    silenceThreshold = 0.01,
    sampleRate = 16000
) => {
    const locale = useLocaleInfo();

    const { speechToText } = useLlmContext();

    const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');

    const recorderRef = useRef(new AudioRecorder({ sampleRate, bufferLengthInSamples: 4096 }));
    const waveformRef = useRef<number[]>([]);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAudioManager();

    const resetSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    };

    const handleStopRecording = async () => {
        resetSilenceTimeout();

        recorderRef.current.stop();

        setStatus('processing');

        // HINT: We need time for AudioRecorder to process the audio data, would be nice to have an event there
        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

        const transcribed = await speechToText
            .transcribe(waveformRef.current, { language: locale.languageCode as SpeechToTextLanguage })
            .catch(() => '');

        await onComplete(transcribed);

        setStatus('idle');
    };

    const handleStartRecording = () => {
        setStatus('recording');

        waveformRef.current = [];
        recorderRef.current.start();
        silenceTimeoutRef.current = setTimeout(() => void handleStopRecording(), silenceTimeoutMs);
    };

    useEffect(() => {
        recorderRef.current.onAudioReady(({ buffer }) => {
            const samples = buffer.getChannelData(0);

            if (calculateRMS(samples) > silenceThreshold) {
                waveformRef.current.push(...Array.from(samples));

                resetSilenceTimeout();

                silenceTimeoutRef.current = setTimeout(() => void handleStopRecording(), silenceTimeoutMs);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => resetSilenceTimeout, []);

    return [handleStartRecording, handleStopRecording, status] as const;
};
