import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { SttInterface } from '../context/llm.context';

/* eslint-disable lingui/no-unlocalized-strings */
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin';
const MODEL_FILENAME = 'ggml-small.bin';
/* eslint-enable lingui/no-unlocalized-strings */

const REALTIME_AUDIO_SEC = 60;
const REALTIME_AUDIO_SLICE_SEC = 5;

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

// eslint-disable-next-line max-lines-per-function -- STT hook requires model lifecycle and streaming state management
export const useWhisperStt = (): SttInterface => {
    const contextRef = useRef<WhisperContext | null>(null);
    const isLoadingRef = useRef(false);
    const isMountedRef = useRef(true);

    const [isReady, setIsReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [committedTranscription, setCommittedTranscription] = useState('');
    const [nonCommittedTranscription, setNonCommittedTranscription] = useState('');

    const stopFnRef = useRef<(() => Promise<void>) | null>(null);
    const resolveStreamRef = useRef<((text: string) => void) | null>(null);

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
            void releaseAllWhisper();
        };
    }, []);

    const stream = async (options: { language: string }): Promise<string> => {
        if (!isDefined(contextRef.current)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Whisper model not loaded');
        }

        setCommittedTranscription('');
        setNonCommittedTranscription('');

        const { stop, subscribe } = await contextRef.current.transcribeRealtime({
            language: options.language,
            realtimeAudioSec: REALTIME_AUDIO_SEC,
            realtimeAudioSliceSec: REALTIME_AUDIO_SLICE_SEC
        });

        stopFnRef.current = stop;

        return new Promise<string>(resolve => {
            resolveStreamRef.current = resolve;

            subscribe(event => {
                if (!isMountedRef.current) {
                    return;
                }

                const text = event.data?.result ?? '';

                if (event.isCapturing) {
                    setNonCommittedTranscription(text);
                } else {
                    setCommittedTranscription(text);
                    setNonCommittedTranscription('');
                    resolveStreamRef.current?.(text);
                    resolveStreamRef.current = null;
                }
            });
        });
    };

    const streamInsert = (_samples: Float32Array): void => {
        // eslint-disable-next-line no-empty-function -- whisper.rn transcribeRealtime manages its own audio recording
    };

    const streamStop = (): void => {
        if (isDefined(stopFnRef.current)) {
            void stopFnRef.current();
            stopFnRef.current = null;
        }
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
