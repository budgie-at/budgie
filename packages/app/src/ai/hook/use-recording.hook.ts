import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS,
    calculateRMS
} from '@budgie/ai';
import { getLogger } from '@budgie/logger';
import { useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAudioManager } from './use-audio-manager.hook';

import type { AudioBuffer } from 'react-native-audio-api';

const logger = getLogger('useRecording');

const AUDIO_LOG_INTERVAL_MS = 1000;

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
    const audioBufferCountRef = useRef(0);
    const voicedBufferCountRef = useRef(0);
    const invalidBufferCountRef = useRef(0);
    const lastAudioLogAtRef = useRef(0);
    const wasAboveThresholdRef = useRef(false);
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
        logger.log('cleanup', {
            sessionId: sessionIdRef.current,
            audioBufferCount: audioBufferCountRef.current,
            voicedBufferCount: voicedBufferCountRef.current,
            invalidBufferCount: invalidBufferCountRef.current
        });
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
            logger.log('silence:detected', {
                sessionId,
                audioBufferCount: audioBufferCountRef.current,
                voicedBufferCount: voicedBufferCountRef.current
            });
            cleanup();
            callbacksRef.current.onSilenceDetected?.();
        }, SILENCE_TIMEOUT_MS);
    };

    const logThresholdChange = (sessionId: number, isAboveThreshold: boolean, rms: number) => {
        if (isAboveThreshold === wasAboveThresholdRef.current) {
            return;
        }
        logger.log('voice:threshold', {
            sessionId,
            isAboveThreshold,
            rms: rms.toFixed(5),
            threshold: SILENCE_THRESHOLD
        });
        wasAboveThresholdRef.current = isAboveThreshold;
    };

    const logAudioSummary = (sessionId: number, isAboveThreshold: boolean, rms: number, level: number) => {
        const currentTime = Date.now();

        if (currentTime - lastAudioLogAtRef.current < AUDIO_LOG_INTERVAL_MS) {
            return;
        }
        logger.log('audio:summary', {
            sessionId,
            audioBufferCount: audioBufferCountRef.current,
            voicedBufferCount: voicedBufferCountRef.current,
            rms: rms.toFixed(5),
            audioLevel: level.toFixed(3),
            isAboveThreshold
        });
        lastAudioLogAtRef.current = currentTime;
    };

    const handleAudioBuffer = (samples: Float32Array, sessionId: number) => {
        if (sessionId !== sessionIdRef.current) {
            return;
        }

        const rms = calculateRMS(samples);
        const level = Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1);
        const isAboveThreshold = rms > SILENCE_THRESHOLD;
        audioBufferCountRef.current += 1;
        setAudioLevel(level);

        callbacksRef.current.onAudioBuffer?.(samples);

        if (isAboveThreshold) {
            voicedBufferCountRef.current += 1;
            resetSilenceTimeout(sessionId);
        }
        logThresholdChange(sessionId, isAboveThreshold, rms);
        logAudioSummary(sessionId, isAboveThreshold, rms, level);
    };

    const getRecorderSamples = (buffer: AudioBuffer): Float32Array | null => {
        if (buffer.sampleRate !== SAMPLE_RATE || !isPositiveNumber(buffer.numberOfChannels)) {
            invalidBufferCountRef.current += 1;
            if (invalidBufferCountRef.current <= 3 || invalidBufferCountRef.current % 10 === 0) {
                logger.log('audio:invalid-buffer', {
                    invalidBufferCount: invalidBufferCountRef.current,
                    sampleRate: buffer.sampleRate,
                    expectedSampleRate: SAMPLE_RATE,
                    numberOfChannels: buffer.numberOfChannels
                });
            }

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

            logger.log('recorder:init', {
                sessionId,
                sampleRate: SAMPLE_RATE,
                bufferLength: BUFFER_LENGTH,
                silenceTimeoutMs: SILENCE_TIMEOUT_MS,
                silenceThreshold: SILENCE_THRESHOLD
            });
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
            logger.log('recorder:start', { sessionId });
            resetSilenceTimeout(sessionId);
        }, RECORDER_INIT_DELAY_MS);
    };

    const start = () => {
        cleanup();

        sessionIdRef.current += 1;
        const sessionId = sessionIdRef.current;

        audioBufferCountRef.current = 0;
        voicedBufferCountRef.current = 0;
        invalidBufferCountRef.current = 0;
        lastAudioLogAtRef.current = 0;
        wasAboveThresholdRef.current = false;
        logger.log('start', {
            sessionId,
            recorderInitDelayMs: RECORDER_INIT_DELAY_MS
        });
        setStatus('recording');
        initializeRecorder(sessionId);
    };

    const stop = () => {
        logger.log('stop', {
            sessionId: sessionIdRef.current,
            audioBufferCount: audioBufferCountRef.current,
            voicedBufferCount: voicedBufferCountRef.current
        });
        cleanup();
    };

    const cancel = () => {
        logger.log('cancel', {
            sessionId: sessionIdRef.current,
            audioBufferCount: audioBufferCountRef.current,
            voicedBufferCount: voicedBufferCountRef.current
        });
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
