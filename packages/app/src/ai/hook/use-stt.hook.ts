import { filterTranscriptionTokens } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { useLlmContext } from '../context/llm.context';

type SttStatus = 'idle' | 'streaming' | 'processing';

interface UseSttReturn {
    status: SttStatus;
    transcription: string;
    partialTranscription: string;
    isReady: boolean;
    downloadProgress: number;
    startStream: () => void;
    insertAudio: (samples: Float32Array) => void;
    stopStream: () => Promise<string>;
    cancelStream: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();
    const { stt } = useLlmContext();

    const [status, setStatus] = useState<SttStatus>('idle');
    const [transcription, setTranscription] = useState('');
    const [partialTranscription, setPartialTranscription] = useState('');

    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const baseTranscriptionRef = useRef('');

    const updateTranscription = () => {
        const currentCommitted = stt.committedTranscription.startsWith(baseTranscriptionRef.current)
            ? stt.committedTranscription.slice(baseTranscriptionRef.current.length)
            : stt.committedTranscription;

        setTranscription(filterTranscriptionTokens(currentCommitted));
        setPartialTranscription(filterTranscriptionTokens(stt.nonCommittedTranscription));
    };

    const resetState = () => {
        setStatus('idle');
        setTranscription('');
        setPartialTranscription('');
    };

    const cleanupStream = async () => {
        if (streamPromiseRef.current) {
            try {
                stt.streamStop();
                await streamPromiseRef.current;
            } catch {
                /* empty */
            } finally {
                // eslint-disable-next-line require-atomic-updates
                streamPromiseRef.current = null;
            }
        }
    };

    const startStream = () => {
        void (async () => {
            await cleanupStream();
            resetState();

            baseTranscriptionRef.current = stt.committedTranscription;

            streamPromiseRef.current = stt.stream({ language: locale.languageCode as SpeechToTextLanguage }).catch(() => '');
            setStatus('streaming');
        })();
    };

    const insertAudio = (samples: Float32Array) => {
        if (status !== 'streaming') {
            return;
        }

        stt.streamInsert(samples);
        updateTranscription();
    };

    const stopStream = async (): Promise<string> => {
        if (!streamPromiseRef.current) {
            return transcription;
        }

        setStatus('processing');

        try {
            stt.streamStop();
            const streamResult = await streamPromiseRef.current;
            const finalText = filterTranscriptionTokens(streamResult).trim();
            setTranscription(finalText);
            setPartialTranscription('');
            setStatus('idle');

            return finalText;
        } catch {
            setStatus('idle');
            throw new Error(t`Transcription failed`);
        } finally {
            // eslint-disable-next-line require-atomic-updates
            streamPromiseRef.current = null;
        }
    };

    const cancelStream = () => {
        void (async () => {
            await cleanupStream();
            resetState();
        })();
    };

    return {
        status,
        transcription,
        partialTranscription,
        isReady: stt.isReady,
        downloadProgress: stt.downloadProgress,
        startStream,
        insertAudio,
        stopStream,
        cancelStream
    };
};
