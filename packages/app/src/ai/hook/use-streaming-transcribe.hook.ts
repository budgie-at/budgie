import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage, SpeechToTextModule } from 'react-native-executorch';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { useLlmContext } from '../context/llm.context';
import { calculateRMS } from '../util/calculate-rms.util';
import { filterTranscriptionTokens } from '../util/filter-transcription-tokens.util';

import { useAudioManager } from './use-audio-manager.hook';

type TranscribeStatus = 'idle' | 'recording' | 'processing';

interface TranscriptionState {
    committed: string;
    partial: string;
}

interface UseStreamingTranscribeReturn {
    startRecording: () => void;
    stopRecording: () => void;
    status: TranscribeStatus;
    transcription: TranscriptionState;
    audioLevel: number;
    isVoiceDetected: boolean;
}

const SAMPLE_RATE = 16000;
const BUFFER_LENGTH = 1600;
const SILENCE_TIMEOUT_MS = 2000;
const SILENCE_THRESHOLD = 0.01;
const VOICE_DETECTION_THRESHOLD = 0.02;
const AUDIO_LEVEL_MULTIPLIER = 10;
const INITIAL_TRANSCRIPTION: TranscriptionState = { committed: '', partial: '' };

interface StreamTranscriptionParams {
    speechToTextModule: SpeechToTextModule;
    languageCode: string;
    isStreamingRef: React.MutableRefObject<boolean>;
    committedTextRef: React.MutableRefObject<string>;
    setTranscription: React.Dispatch<React.SetStateAction<TranscriptionState>>;
}

const needsSpace = (existing: string, incoming: string): boolean =>
    existing.length > 0 && incoming.length > 0 && !existing.endsWith(' ') && !incoming.startsWith(' ');

const processStreamChunk = (
    chunk: { committed: string; nonCommitted: string },
    committedTextRef: React.MutableRefObject<string>,
    setTranscription: React.Dispatch<React.SetStateAction<TranscriptionState>>
) => {
    const filteredCommitted = filterTranscriptionTokens(chunk.committed);
    const filteredPartial = filterTranscriptionTokens(chunk.nonCommitted);

    if (filteredCommitted) {
        const separator = needsSpace(committedTextRef.current, filteredCommitted) ? ' ' : '';
        committedTextRef.current += separator + filteredCommitted;
        setTranscription(prev => ({
            committed: prev.committed + separator + filteredCommitted,
            partial: filteredPartial
        }));
    } else {
        setTranscription(prev => ({ ...prev, partial: filteredPartial }));
    }
};

const runStreamTranscription = async (params: StreamTranscriptionParams): Promise<void> => {
    const { speechToTextModule, languageCode, isStreamingRef, committedTextRef, setTranscription } = params;

    try {
        for await (const chunk of speechToTextModule.stream({ language: languageCode as SpeechToTextLanguage })) {
            if (!isStreamingRef.current) {break;}
            processStreamChunk(chunk, committedTextRef, setTranscription);
        }
    } catch {
        setTranscription(INITIAL_TRANSCRIPTION);
    }
};

// eslint-disable-next-line max-statements
export const useStreamingTranscribe = (onComplete: (transcribed: string) => Promise<void>): UseStreamingTranscribeReturn => {
    const locale = useLocaleInfo();
    const { speechToTextModule } = useLlmContext();

    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [transcription, setTranscription] = useState<TranscriptionState>(INITIAL_TRANSCRIPTION);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isVoiceDetected, setIsVoiceDetected] = useState(false);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isStreamingRef = useRef(false);
    const committedTextRef = useRef('');

    useAudioManager();

    const resetSilenceTimeout = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    }, []);

    const stopRecording = useCallback(() => {
        resetSilenceTimeout();
        recorderRef.current?.stop();

        if (isStreamingRef.current) {
            speechToTextModule.streamStop();
            isStreamingRef.current = false;
        }

        setStatus('processing');
        setAudioLevel(0);
        setIsVoiceDetected(false);

        const finalText = filterTranscriptionTokens(committedTextRef.current + transcription.partial);
        setTranscription(prev => ({ committed: prev.committed + prev.partial, partial: '' }));

        void onComplete(finalText.trim()).finally(() => void setStatus('idle'));
    }, [onComplete, resetSilenceTimeout, speechToTextModule, transcription.partial]);

    const startRecording = useCallback(() => {
        setStatus('recording');
        setTranscription(INITIAL_TRANSCRIPTION);
        committedTextRef.current = '';
        setAudioLevel(0);
        setIsVoiceDetected(false);

        if (!recorderRef.current) {
            recorderRef.current = new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: BUFFER_LENGTH });
        }

        recorderRef.current.onAudioReady(({ buffer }) => {
            const samples = buffer.getChannelData(0);
            const rms = calculateRMS(samples);

            setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));
            setIsVoiceDetected(rms > VOICE_DETECTION_THRESHOLD);
            speechToTextModule.streamInsert(samples);

            if (rms > SILENCE_THRESHOLD) {
                resetSilenceTimeout();
                silenceTimeoutRef.current = setTimeout(stopRecording, SILENCE_TIMEOUT_MS);
            }
        });

        recorderRef.current.start();
        isStreamingRef.current = true;
        silenceTimeoutRef.current = setTimeout(stopRecording, SILENCE_TIMEOUT_MS);

        void runStreamTranscription({
            speechToTextModule,
            languageCode: locale.languageCode,
            isStreamingRef,
            committedTextRef,
            setTranscription
        });
    }, [locale.languageCode, resetSilenceTimeout, speechToTextModule, stopRecording]);

    useEffect(
        () => () => {
            resetSilenceTimeout();
            recorderRef.current?.stop();
            if (isStreamingRef.current) {
                speechToTextModule.streamStop();
            }
        },
        [resetSilenceTimeout, speechToTextModule]
    );

    return { startRecording, stopRecording, status, transcription, audioLevel, isVoiceDetected };
};
