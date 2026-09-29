import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS,
    calculateRMS
} from '@budgie/ai';
import * as Effect from 'effect/Effect';
import { useLayoutEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';

import { useAudioManager } from './use-audio-manager.hook';

import type * as Fiber from 'effect/Fiber';
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

// eslint-disable-next-line max-lines-per-function, max-statements -- Hook orchestrates recorder lifecycle and silence detection
export const useRecording = (callbacks: RecordingCallbacks = {}): UseRecordingReturn => {
    useAudioManager();

    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [audioLevel, setAudioLevel] = useState(0);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<Fiber.Fiber<void> | null>(null);
    const recorderInitTimeoutRef = useRef<Fiber.Fiber<void> | null>(null);
    const sessionIdRef = useRef(0);
    const callbacksRef = useRef(callbacks);

    useLayoutEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    const runAfter = (delayMs: number, callback: () => void): Fiber.Fiber<void> =>
        appRuntime.runFork(Effect.delay(Effect.sync(callback), delayMs));

    const clearTimeouts = () => {
        silenceTimeoutRef.current?.interruptUnsafe();
        silenceTimeoutRef.current = null;
        recorderInitTimeoutRef.current?.interruptUnsafe();
        recorderInitTimeoutRef.current = null;
    };

    const stopRecorder = () => {
        const recorder = recorderRef.current;
        recorderRef.current = null;
        recorder?.stop().catch((error: unknown) => {
            appRuntime.runFork(Effect.logError('recorder:stop', { errorMessage: getErrorMessage(error) }));
        });
    };

    const cleanup = () => {
        clearTimeouts();
        stopRecorder();
        setStatus('idle');
        setAudioLevel(0);
    };

    const resetSilenceTimeout = (sessionId: number) => {
        silenceTimeoutRef.current?.interruptUnsafe();
        silenceTimeoutRef.current = runAfter(SILENCE_TIMEOUT_MS, () => {
            if (sessionId !== sessionIdRef.current) {
                return;
            }
            cleanup();
            callbacksRef.current.onSilenceDetected?.();
        });
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
            return new Float32Array(buffer.getChannelData(0));
        }

        const channelSamples = Array.from(
            { length: buffer.numberOfChannels },
            (_value, channelIndex) => new Float32Array(buffer.getChannelData(channelIndex))
        );
        const samples = new Float32Array(channelSamples[0]?.length ?? 0);

        for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
            let sampleTotal = 0;

            for (const samplesForChannel of channelSamples) {
                sampleTotal += samplesForChannel[sampleIndex] ?? 0;
            }

            samples[sampleIndex] = sampleTotal / buffer.numberOfChannels;
        }

        return samples;
    };

    const initializeRecorder = (sessionId: number) => {
        recorderInitTimeoutRef.current = runAfter(RECORDER_INIT_DELAY_MS, () => {
            if (sessionId !== sessionIdRef.current) {
                return;
            }

            const recorder = new AudioRecorder();
            recorderRef.current = recorder;
            recorder.onAudioReady({ sampleRate: SAMPLE_RATE, bufferLength: BUFFER_LENGTH, channelCount: 1 }, ({ buffer }) => {
                if (sessionId !== sessionIdRef.current) {
                    return;
                }
                const samples = getRecorderSamples(buffer);

                if (isDefined(samples)) {
                    handleAudioBuffer(samples, sessionId);
                }
            });
            recorder.start().catch((error: unknown) => {
                appRuntime.runFork(Effect.logError('recorder:start', { errorMessage: getErrorMessage(error) }));

                if (sessionId === sessionIdRef.current) {
                    cleanup();
                }
            });

            resetSilenceTimeout(sessionId);
        });
    };

    const start = () => {
        cleanup();

        sessionIdRef.current += 1;
        setStatus('recording');
        initializeRecorder(sessionIdRef.current);
    };

    return {
        status,
        audioLevel,
        start,
        stop: cleanup,
        cancel: cleanup
    };
};
