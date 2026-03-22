import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';
import { type RealtimeTranscribeEvent, RealtimeTranscriber } from 'whisper.rn/realtime-transcription';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { type SttContextInterface } from '../context/llm.context';

/* jscpd:ignore-start -- Intentionally mirrors use-llama-llm.hook.ts model lifecycle pattern */
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin';
const MODEL_FILENAME = 'ggml-small.bin';

const AUDIO_SLICE_SEC = 3;
const AUDIO_MIN_SEC = 0.5;
const AUDIO_STREAM_CONFIG = { sampleRate: 16000, channels: 1, bitsPerSample: 16, bufferSize: 16 * 1024 } as const;

interface TranscriptionResultEntry {
    readonly slice: { readonly index: number };
    readonly transcribeEvent: { readonly data?: { readonly result?: string } };
}

const downloadModel = async (onProgress: (progress: number) => void): Promise<string> => {
    const destPath = `${Paths.document.uri}${MODEL_FILENAME}`;
    const destFile = new File(destPath);

    if (destFile.exists) {
        onProgress(1);

        return destPath;
    }

    const download = createDownloadResumable(MODEL_URL, destPath, {}, progress => {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    });

    const result = await download.downloadAsync();

    if (!isDefined(result?.uri)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('Whisper model download failed');
    }

    return result.uri;
};

const aggregateTranscription = (transcriber: RealtimeTranscriber | null): string =>
    transcriber
        ?.getTranscriptionResults()
        .sort((left: TranscriptionResultEntry, right: TranscriptionResultEntry) => left.slice.index - right.slice.index)
        .map((result: TranscriptionResultEntry) => result.transcribeEvent.data?.result?.trim() ?? '')
        .filter(Boolean)
        .join(' ')
        .trim() ?? '';

// eslint-disable-next-line max-lines-per-function, max-statements -- STT hook requires model lifecycle and streaming state management
export const useWhisperStt = (): SttContextInterface => {
    const contextRef = useRef<WhisperContext | null>(null);
    const transcriberRef = useRef<RealtimeTranscriber | null>(null);
    const audioStreamRef = useRef<ManualAudioStreamAdapter | null>(null);
    const isLoadingRef = useRef(false);
    const isMountedRef = useRef(true);
    const resolveStreamRef = useRef<((text: string) => void) | null>(null);
    const rejectStreamRef = useRef<((error: unknown) => void) | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [committedTranscription, setCommittedTranscription] = useState('');
    const [nonCommittedTranscription, setNonCommittedTranscription] = useState('');

    const clearStreamRefs = () => {
        resolveStreamRef.current = null;
        rejectStreamRef.current = null;
        transcriberRef.current = null;
        audioStreamRef.current = null;
    };

    const finalizeState = (transcriber: RealtimeTranscriber | null): string => {
        const finalText = aggregateTranscription(transcriber);
        setCommittedTranscription(finalText);
        setNonCommittedTranscription('');

        return finalText;
    };

    const stopActiveStream = async (): Promise<string> => {
        const transcriber = transcriberRef.current;
        const audioStream = audioStreamRef.current;

        if (!isDefined(transcriber)) {
            return committedTranscription;
        }

        try {
            if (audioStream?.isRecording() ?? false) {
                await transcriber.nextSlice();
            }

            await transcriber.stop();
            await audioStream?.release();

            const finalText = finalizeState(transcriber);
            resolveStreamRef.current?.(finalText);

            return finalText;
        } catch (streamError) {
            rejectStreamRef.current?.(streamError);
            throw streamError;
        } finally {
            clearStreamRefs();
        }
    };

    useEffect(() => {
        if (isLoadingRef.current) {
            return emptyFn;
        }
        isLoadingRef.current = true;
        isMountedRef.current = true;

        const isMounted = (): boolean => isMountedRef.current;

        const initializeModel = async (): Promise<void> => {
            try {
                const modelPath = await downloadModel(setDownloadProgress);

                if (!isMounted()) {
                    return;
                }

                setIsInitializing(true);
                contextRef.current = await initWhisper({ filePath: modelPath });

                if (!isMounted()) {
                    void releaseAllWhisper();

                    return;
                }

                setIsReady(true);
            } catch (err: unknown) {
                if (isMounted()) {
                    setError(getErrorMessage(err));
                }
            } finally {
                if (isMounted()) {
                    setIsInitializing(false);
                }
                isLoadingRef.current = false;
            }
        };

        void initializeModel();

        return () => {
            isMountedRef.current = false;
            const transcriber = transcriberRef.current;
            const audioStream = audioStreamRef.current;
            clearStreamRefs();
            void transcriber?.stop().catch(emptyFn);
            void audioStream?.release().catch(emptyFn);
            void releaseAllWhisper();
        };
    }, []);

    const handleTranscribe = (event: RealtimeTranscribeEvent): void => {
        if (!isMountedRef.current) {
            return;
        }

        if (event.type === 'transcribe') {
            setCommittedTranscription(aggregateTranscription(transcriberRef.current));
            setNonCommittedTranscription('');

            return;
        }

        if (event.type === 'error') {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            setError('Whisper transcription failed');
        }
    };

    const startFreshStream = async (options?: { readonly language?: string }): Promise<string> => {
        setError(null);
        setCommittedTranscription('');
        setNonCommittedTranscription('');

        const audioStream = new ManualAudioStreamAdapter();
        const transcriber = new RealtimeTranscriber(
            { whisperContext: contextRef.current, audioStream },
            {
                audioSliceSec: AUDIO_SLICE_SEC,
                audioMinSec: AUDIO_MIN_SEC,
                promptPreviousSlices: true,
                audioStreamConfig: AUDIO_STREAM_CONFIG,
                transcribeOptions: isDefined(options?.language) ? { language: options.language } : {}
            },
            {
                onTranscribe: handleTranscribe,
                onError: (errorMessage: string) => {
                    if (isMountedRef.current) {
                        setError(errorMessage);
                    }
                }
            }
        );

        audioStreamRef.current = audioStream;
        transcriberRef.current = transcriber;

        try {
            await transcriber.start();
        } catch (streamError) {
            clearStreamRefs();
            throw streamError;
        }

        return new Promise<string>((resolve, reject) => {
            resolveStreamRef.current = resolve;
            rejectStreamRef.current = reject;
        });
    };

    const stream = async (options?: { readonly language?: string }): Promise<string> => {
        if (!isDefined(contextRef.current)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Whisper model not loaded');
        }

        if (isDefined(transcriberRef.current)) {
            await stopActiveStream().catch(emptyFn);
        }

        return startFreshStream(options);
    };

    const streamInsert = (samples: Float32Array): void => {
        audioStreamRef.current?.push(samples);
    };

    const streamStop = async (): Promise<void> => {
        await stopActiveStream();
    };

    return {
        isReady,
        isInitializing,
        downloadProgress,
        error,
        committedTranscription,
        nonCommittedTranscription,
        stream,
        streamInsert,
        streamStop
    };
};
/* jscpd:ignore-end */
