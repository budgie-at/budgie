import { filterTranscriptionTokens } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';

import { useSttSnapshot } from './use-stt-snapshot.hook';

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

    const sttSnapshot = useSttSnapshot();

    const [status, setStatus] = useState<SttStatus>('idle');
    const [baseTranscription, setBaseTranscription] = useState('');
    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const streamGenerationRef = useRef(0);

    const isCurrentStream = (generation: number): boolean => generation === streamGenerationRef.current;

    const cleanupStream = async (generation: number) => {
        const streamPromise = streamPromiseRef.current;

        if (!isDefined(streamPromise)) {
            return;
        }
        if (isCurrentStream(generation)) {
            streamPromiseRef.current = null;
        }
        try {
            await sttService.streamCancel();
            await streamPromise;
        } catch {
            emptyFn();
        }
    };

    const initStream = (generation: number) => {
        if (!isCurrentStream(generation)) {
            return;
        }

        setStatus('idle');
        setBaseTranscription(sttService.committedTranscription);
        const language = isSpeechToTextLanguage(locale.languageCode) ? locale.languageCode : null;
        streamPromiseRef.current = sttService.stream(language);
        setStatus('streaming');
    };

    const startStream = () => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;

        cleanupStream(generation)
            .then(() => void initStream(generation))
            .catch(emptyFn);
    };

    const insertAudio = (samples: Float32Array) => {
        if (status !== 'streaming') {
            return;
        }

        sttService.streamInsert(samples);
    };

    const committedTranscription = sttSnapshot.committedTranscription.startsWith(baseTranscription)
        ? sttSnapshot.committedTranscription.slice(baseTranscription.length)
        : sttSnapshot.committedTranscription;
    const transcription = filterTranscriptionTokens(committedTranscription);
    const partialTranscription = filterTranscriptionTokens(sttSnapshot.nonCommittedTranscription);

    const resolveStoppedStream = async (streamPromise: Promise<string>, generation: number): Promise<string> => {
        await sttService.streamStop();
        const streamResult = await streamPromise;
        const finalText = filterTranscriptionTokens(streamResult).trim();

        if (!isCurrentStream(generation)) {
            return '';
        }

        setStatus('idle');

        return finalText;
    };

    const stopStream = async (): Promise<string> => {
        const generation = streamGenerationRef.current;
        const streamPromise = streamPromiseRef.current;

        if (!isDefined(streamPromise)) {
            return transcription;
        }

        streamPromiseRef.current = null;
        setStatus('processing');

        try {
            return await resolveStoppedStream(streamPromise, generation);
        } catch {
            if (isCurrentStream(generation)) {
                setStatus('idle');
            }
            throw new Error(t`Transcription failed`);
        }
    };

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;

        setStatus('idle');
        cleanupStream(generation).catch(emptyFn);
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
