import { filterTranscriptionTokens } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';

import { useSttResidency } from './use-stt-residency.hook';
import { useSttSnapshot } from './use-stt-snapshot.hook';

type SttStatus = 'idle' | 'streaming' | 'processing';

interface UseSttReturn {
    readonly status: SttStatus;
    readonly transcription: string;
    readonly partialTranscription: string;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startStream: () => Promise<void>;
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
    const { acquireSttResidency, releaseSttResidency } = useSttResidency();

    const startStream = async (): Promise<void> => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;
        const language = isSpeechToTextLanguage(locale.languageCode) ? locale.languageCode : null;

        await acquireSttResidency();

        if (generation !== streamGenerationRef.current) {
            return;
        }

        await sttService.streamCancel().catch(emptyFn);
        setBaseTranscription(sttService.committedTranscription);
        await sttService.streamStart(language).catch(emptyFn);
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
            releaseSttResidency();
            if (generation === streamGenerationRef.current) {
                setStatus('idle');
            }
        }
    };

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        setStatus('idle');
        sttService.streamCancel().catch(emptyFn);
        releaseSttResidency();
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
