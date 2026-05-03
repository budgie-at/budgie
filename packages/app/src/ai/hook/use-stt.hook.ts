import { filterTranscriptionTokens } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

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

export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();

    const sttSnapshot = useSttSnapshot();

    const [status, setStatus] = useState<SttStatus>('idle');
    const [baseTranscription, setBaseTranscription] = useState('');
    const streamGenerationRef = useRef(0);

    const isCurrentStream = (generation: number): boolean => generation === streamGenerationRef.current;

    const startStream = () => {
        streamGenerationRef.current += 1;
        const language = isSpeechToTextLanguage(locale.languageCode) ? locale.languageCode : null;

        sttService.streamCancel().catch(emptyFn);
        setBaseTranscription(sttService.committedTranscription);
        sttService.streamStart(language).catch(emptyFn);
        setStatus('streaming');
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

    const stopStream = async (): Promise<string> => {
        const generation = streamGenerationRef.current;

        setStatus('processing');

        try {
            return filterTranscriptionTokens(await sttService.streamStop()).trim();
        } catch {
            throw new Error(t`Transcription failed`);
        } finally {
            if (isCurrentStream(generation)) {
                setStatus('idle');
            }
        }
    };

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        setStatus('idle');
        sttService.streamCancel().catch(emptyFn);
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
