import { filterTranscriptionTokens } from '@budgie/ai';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';

import { useStartStt } from './use-start-stt.hook';
import { useSttSnapshot } from './use-stt-snapshot.hook';

const logger = getLogger('useStt');

type SttStatus = 'idle' | 'streaming' | 'processing';

interface UseSttReturn {
    readonly status: SttStatus;
    readonly transcription: string;
    readonly partialTranscription: string;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startStream: () => void;
    readonly insertAudio: (samples: Float32Array) => void;
    readonly stopStream: () => Promise<string>;
    readonly cancelStream: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Hook manages streaming lifecycle with cleanup and error paths
export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();

    useStartStt();
    const sttSnapshot = useSttSnapshot();

    const [status, setStatus] = useState<SttStatus>('idle');
    const [baseTranscription, setBaseTranscription] = useState('');
    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const streamGenerationRef = useRef(0);

    const isCurrentStream = (generation: number): boolean => generation === streamGenerationRef.current;

    const resetState = () => {
        setStatus('idle');
    };

    const cleanupStream = async (generation: number) => {
        const streamPromise = streamPromiseRef.current;

        if (isDefined(streamPromise)) {
            logger.log('stream:cleanup:start', { generation, isCurrentStream: isCurrentStream(generation) });
            if (isCurrentStream(generation)) {
                streamPromiseRef.current = null;
            }
            try {
                await sttService.streamCancel();
                await streamPromise;
                logger.log('stream:cleanup:done', { generation });
            } catch {
                logger.log('stream:cleanup:swallow', { generation });
                emptyFn();
            }
        }
    };

    const initStream = (generation: number) => {
        if (!isCurrentStream(generation)) {
            return;
        }

        resetState();
        setBaseTranscription(sttService.committedTranscription);
        const streamOptions = isSpeechToTextLanguage(locale.languageCode) ? { language: locale.languageCode } : {};
        logger.log('stream:init', { generation, language: streamOptions.language ?? 'default' });
        streamPromiseRef.current = sttService.stream(streamOptions).catch(() => '');
        setStatus('streaming');
    };

    const startStream = () => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;
        logger.log('stream:start', { generation, status });

        cleanupStream(generation)
            .then(() => void initStream(generation))
            .catch((error: unknown) => {
                logger.error('stream:start:throw', { generation, errorMessage: getErrorMessage(error) });
                emptyFn();
            });
    };

    const insertAudio = (samples: Float32Array) => {
        if (status !== 'streaming') {
            return;
        }

        sttService.streamInsert(samples);
    };

    const finishStopStream = (finalText: string, generation: number): string => {
        if (!isCurrentStream(generation)) {
            logger.log('stream:stop:stale', { generation, finalTextLen: finalText.length });

            return '';
        }

        setStatus('idle');
        logger.log('stream:stop:finish', { generation, finalTextLen: finalText.length });

        return finalText;
    };

    const handleStopStreamError = (generation: number): never => {
        if (isCurrentStream(generation)) {
            setStatus('idle');
        }

        logger.log('stream:stop:error', { generation });
        throw new Error(t`Transcription failed`);
    };

    const committedTranscription = sttSnapshot.committedTranscription.startsWith(baseTranscription)
        ? sttSnapshot.committedTranscription.slice(baseTranscription.length)
        : sttSnapshot.committedTranscription;
    const transcription = filterTranscriptionTokens(committedTranscription);
    const partialTranscription = filterTranscriptionTokens(sttSnapshot.nonCommittedTranscription);

    const resolveStoppedStream = async (streamPromise: Promise<string>, generation: number): Promise<string> => {
        await sttService.streamStop();
        logger.log('stream:stop:service-done', { generation });
        const streamResult = await streamPromise;
        const finalText = filterTranscriptionTokens(streamResult).trim();
        logger.log('stream:stop:promise-done', {
            generation,
            streamResultPreview: streamResult.slice(0, 80),
            streamResultLen: streamResult.length,
            finalTextPreview: finalText.slice(0, 80),
            finalTextLen: finalText.length
        });

        return finishStopStream(finalText, generation);
    };

    const stopStream = async (): Promise<string> => {
        const generation = streamGenerationRef.current;
        const streamPromise = streamPromiseRef.current;

        if (!isDefined(streamPromise)) {
            logger.log('stream:stop:no-active-stream', { generation, transcriptionLen: transcription.length });

            return transcription;
        }

        streamPromiseRef.current = null;
        setStatus('processing');
        logger.log('stream:stop:start', { generation });

        try {
            return await resolveStoppedStream(streamPromise, generation);
        } catch {
            return handleStopStreamError(generation);
        }
    };

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;

        resetState();
        logger.log('stream:cancel', { generation });
        cleanupStream(generation).catch((error: unknown) => {
            logger.error('stream:cancel:throw', { generation, errorMessage: getErrorMessage(error) });
            emptyFn();
        });
    };

    return {
        status,
        transcription,
        partialTranscription,
        isReady: sttSnapshot.status === AiSubsystemStatusEnum.READY,
        downloadProgress: sttSnapshot.downloadProgress,
        startStream,
        insertAudio,
        stopStream,
        cancelStream
    };
};
