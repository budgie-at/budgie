import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { isNotEmptyString } from '@rnw-community/shared';

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
const SILENCE_TIMEOUT_MS = 2500;
const SILENCE_THRESHOLD = 0.01;
const VOICE_DETECTION_THRESHOLD = 0.02;
const AUDIO_LEVEL_MULTIPLIER = 10;
const INITIAL_TRANSCRIPTION: TranscriptionState = { committed: '', partial: '' };

const needsSpace = (existing: string, incoming: string): boolean =>
    existing.length > 0 && incoming.length > 0 && !existing.endsWith(' ') && !incoming.startsWith(' ');

// eslint-disable-next-line max-statements,max-lines-per-function
export const useStreamingTranscribe = (onComplete: (transcribed: string) => Promise<void>): UseStreamingTranscribeReturn => {
    const locale = useLocaleInfo();
    const { speechToTextModule } = useLlmContext();

    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [transcription, setTranscription] = useState<TranscriptionState>(INITIAL_TRANSCRIPTION);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isVoiceDetected, setIsVoiceDetected] = useState(false);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionIdRef = useRef(0);
    const committedTextRef = useRef('');
    const partialTextRef = useRef('');
    const isRecordingRef = useRef(false);

    useAudioManager();

    const clearSilenceTimeout = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    }, []);

    const cleanupRecorder = useCallback(() => {
        clearSilenceTimeout();

        if (recorderRef.current) {
            try {
                recorderRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            recorderRef.current = null;
        }

        try {
            speechToTextModule.streamStop();
        } catch {
            // Ignore stream stop errors
        }

        isRecordingRef.current = false;
    }, [clearSilenceTimeout, speechToTextModule]);

    const processStreamChunk = useCallback(
        (chunk: { committed: string; nonCommitted: string }, currentSessionId: number) => {
            if (sessionIdRef.current !== currentSessionId || !isRecordingRef.current) {
                return;
            }

            const filteredCommitted = filterTranscriptionTokens(chunk.committed);
            const filteredPartial = filterTranscriptionTokens(chunk.nonCommitted);

            if (isNotEmptyString(filteredCommitted)) {
                const separator = needsSpace(committedTextRef.current, filteredCommitted) ? ' ' : '';
                committedTextRef.current += separator + filteredCommitted;
                setTranscription(prev => ({
                    committed: prev.committed + separator + filteredCommitted,
                    partial: filteredPartial
                }));
            }

            partialTextRef.current = filteredPartial;
            setTranscription(prev => ({ ...prev, partial: filteredPartial }));
        },
        []
    );

    const runStreamTranscription = useCallback(
        async (currentSessionId: number) => {
            try {
                const stream = speechToTextModule.stream({ language: locale.languageCode as SpeechToTextLanguage });
                for await (const chunk of stream) {
                    if (sessionIdRef.current !== currentSessionId || !isRecordingRef.current) {
                        break;
                    }
                    processStreamChunk(chunk, currentSessionId);
                }
            } catch {
                // Stream ended or error - this is expected when stopping
            }
        },
        [locale.languageCode, processStreamChunk, speechToTextModule]
    );

    const finishRecording = useCallback(
        (currentSessionId: number) => {
            if (sessionIdRef.current !== currentSessionId) {
                return;
            }

            cleanupRecorder();
            setStatus('processing');
            setAudioLevel(0);
            setIsVoiceDetected(false);

            const finalCommitted = committedTextRef.current;
            const finalPartial = partialTextRef.current;
            const finalText = filterTranscriptionTokens(finalCommitted + (needsSpace(finalCommitted, finalPartial) ? ' ' : '') + finalPartial);

            setTranscription({ committed: finalText.trim(), partial: '' });

            void onComplete(finalText.trim()).finally(() => {
                if (sessionIdRef.current === currentSessionId) {
                    setStatus('idle');
                }
            });
        },
        [cleanupRecorder, onComplete]
    );

    const resetSilenceTimeout = useCallback(
        (currentSessionId: number) => {
            clearSilenceTimeout();
            silenceTimeoutRef.current = setTimeout(() => void finishRecording(currentSessionId), SILENCE_TIMEOUT_MS);
        },
        [clearSilenceTimeout, finishRecording]
    );

    const stopRecording = useCallback(() => void finishRecording(sessionIdRef.current), [finishRecording]);

    const resetRecordingState = useCallback(() => {
        setStatus('recording');
        setTranscription(INITIAL_TRANSCRIPTION);
        setAudioLevel(0);
        setIsVoiceDetected(false);
        committedTextRef.current = '';
        partialTextRef.current = '';
        isRecordingRef.current = true;
    }, []);

    const handleAudioBuffer = useCallback(
        (samples: Float32Array, currentSessionId: number) => {
            const rms = calculateRMS(samples);

            setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));
            setIsVoiceDetected(rms > VOICE_DETECTION_THRESHOLD);

            try {
                speechToTextModule.streamInsert(samples);
            } catch {
                // Ignore insert errors
            }

            if (rms > SILENCE_THRESHOLD) {
                resetSilenceTimeout(currentSessionId);
            }
        },
        [resetSilenceTimeout, speechToTextModule]
    );

    const startRecording = useCallback(() => {
        cleanupRecorder();
        sessionIdRef.current += 1;
        const currentSessionId = sessionIdRef.current;

        resetRecordingState();

        const recorder = new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: BUFFER_LENGTH });
        recorderRef.current = recorder;
        recorder.onAudioReady(({ buffer }) => {
            if (sessionIdRef.current !== currentSessionId || !isRecordingRef.current) {return;}
            handleAudioBuffer(buffer.getChannelData(0), currentSessionId);
        });
        recorder.start();
        resetSilenceTimeout(currentSessionId);
        void runStreamTranscription(currentSessionId);
    }, [cleanupRecorder, handleAudioBuffer, resetRecordingState, resetSilenceTimeout, runStreamTranscription]);

    useEffect(() => cleanupRecorder, [cleanupRecorder]);

    return { startRecording, stopRecording, status, transcription, audioLevel, isVoiceDetected };
};
