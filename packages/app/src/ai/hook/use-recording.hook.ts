import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS,
    calculateRMS
} from '@budgie/ai';
import { useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAudioManager } from './use-audio-manager.hook';

import type { AudioBuffer } from 'react-native-audio-api';

type RecordingStatus = 'idle' | 'recording';

interface RecordingCallbacks {
    readonly onAudioBuffer?: (samples: Float32Array) => void;
    readonly onSilenceDetected?: () => void;
}

interface UseRecordingReturn {
    readonly status: RecordingStatus;
    readonly audioLevel: number;
    readonly start: () => void;
    readonly stop: () => void;
    readonly cancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const useRecording = (callbacks: RecordingCallbacks = {}): UseRecordingReturn => {
    useAudioManager();

    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [audioLevel, setAudioLevel] = useState(0);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recorderInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionIdRef = useRef(0);
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    const clearTimeouts = () => {
        if (isDefined(silenceTimeoutRef.current)) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (isDefined(recorderInitTimeoutRef.current)) {
            clearTimeout(recorderInitTimeoutRef.current);
            recorderInitTimeoutRef.current = null;
        }
    };

    const stopRecorder = () => {
        try {
            recorderRef.current?.stop();
        } finally {
            recorderRef.current = null;
        }
    };

    const resetState = () => {
        setStatus('idle');
        setAudioLevel(0);
    };

    const cleanup = () => {
        clearTimeouts();
        stopRecorder();
        resetState();
    };

    const resetSilenceTimeout = (sessionId: number) => {
        if (isDefined(silenceTimeoutRef.current)) {
            clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
            if (sessionId !== sessionIdRef.current) {
                return;
            }
            cleanup();
            callbacksRef.current.onSilenceDetected?.();
        }, SILENCE_TIMEOUT_MS);
    };

    const handleAudioBuffer = (samples: Float32Array, sessionId: number) => {
        if (sessionId !== sessionIdRef.current) {
            return;
        }

        const rms = calculateRMS(samples);
        setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));

        callbacksRef.current.onAudioBuffer?.(samples);

        if (rms > SILENCE_THRESHOLD) {
            resetSilenceTimeout(sessionId);
        }
    };

    const getRecorderSamples = (buffer: AudioBuffer): Float32Array | null => {
        if (buffer.sampleRate !== SAMPLE_RATE || !isPositiveNumber(buffer.numberOfChannels)) {
            return null;
        }
        if (buffer.numberOfChannels === 1) {
            return buffer.getChannelData(0);
        }

        const firstChannelSamples = buffer.getChannelData(0);
        const samples = new Float32Array(firstChannelSamples.length);

        for (let sampleIndex = 0; sampleIndex < firstChannelSamples.length; sampleIndex += 1) {
            let sampleTotal = 0;

            for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
                sampleTotal += buffer.getChannelData(channelIndex)[sampleIndex];
            }

            samples[sampleIndex] = sampleTotal / buffer.numberOfChannels;
        }

        return samples;
    };

    const initializeRecorder = (sessionId: number) => {
        recorderInitTimeoutRef.current = setTimeout(() => {
            if (sessionId !== sessionIdRef.current) {
                return;
            }

            const recorder = new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: BUFFER_LENGTH });
            recorderRef.current = recorder;
            recorder.onAudioReady(({ buffer }) => {
                if (sessionId !== sessionIdRef.current) {
                    return;
                }
                const samples = getRecorderSamples(buffer);

                if (isDefined(samples)) {
                    handleAudioBuffer(samples, sessionId);
                }
            });
            recorder.start();
            resetSilenceTimeout(sessionId);
        }, RECORDER_INIT_DELAY_MS);
    };

    const start = () => {
        cleanup();

        sessionIdRef.current += 1;
        const sessionId = sessionIdRef.current;

        setStatus('recording');
        initializeRecorder(sessionId);
    };

    const stop = () => {
        cleanup();
    };

    const cancel = () => {
        cleanup();
    };

    return {
        status,
        audioLevel,
        start,
        stop,
        cancel
    };
};
