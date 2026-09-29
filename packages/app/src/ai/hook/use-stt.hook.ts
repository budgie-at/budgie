import { filterTranscriptionTokens } from '@budgie/ai';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';

import { useSttResidency } from './use-stt-residency.hook';

type SttStatus = 'idle' | 'streaming' | 'processing';

interface UseSttReturn {
    readonly status: SttStatus;
    readonly transcription: string;
    readonly partialTranscription: string;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startStream: () => Promise<boolean>;
    readonly insertAudio: (samples: Float32Array) => void;
    readonly stopStream: () => Promise<string>;
    readonly cancelStream: () => void;
}

export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();

    const sttSnapshot = useAtomValue(sttService.snapshot);

    const [status, setStatus] = useState<SttStatus>('idle');
    const [baseTranscription, setBaseTranscription] = useState('');
    const streamGenerationRef = useRef(0);
    const { acquireSttResidency, releaseSttResidency } = useSttResidency();

    const startStream = async (): Promise<boolean> => {
        streamGenerationRef.current += 1;
        const generation = streamGenerationRef.current;
        const language = isSpeechToTextLanguage(locale.languageCode) ? locale.languageCode : null;

        if (!(await acquireSttResidency()) || generation !== streamGenerationRef.current) {
            return false;
        }

        await appRuntime.runPromise(Effect.ignore(sttService.stopStream(false)));
        setBaseTranscription(sttService.committedTranscription);
        const isStreaming = await appRuntime.runPromise(Effect.isSuccess(sttService.streamStart(language)));
        const isCurrentGeneration = generation === streamGenerationRef.current;

        if (!isStreaming && isCurrentGeneration) {
            releaseSttResidency();
        }

        if (!isStreaming || !isCurrentGeneration) {
            return false;
        }

        setStatus('streaming');

        return true;
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

    const stopStream = (): Promise<string> => {
        const generation = streamGenerationRef.current;

        setStatus('processing');

        return appRuntime.runPromise(
            sttService.stopStream(true).pipe(
                Effect.map(text => filterTranscriptionTokens(text).trim()),
                Effect.mapError(() => new Error(t`Transcription failed`)),
                Effect.ensuring(
                    Effect.sync(() => {
                        releaseSttResidency();
                        if (generation === streamGenerationRef.current) {
                            setStatus('idle');
                        }
                    })
                )
            )
        );
    };

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        setStatus('idle');
        appRuntime.runFork(Effect.ignore(sttService.stopStream(false)));
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
