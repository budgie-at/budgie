import { filterTranscriptionTokens } from '@budgie/ai';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import { useRef, useState } from 'react';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { aiModelDownloadSnapshotAtom, sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { SttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';
import { sumAiModelDownloadBytes } from '../utils/sum-ai-model-download-bytes.util';

import { useSttResidency } from './use-stt-residency.hook';

import type { AppServices } from '../../@generic/runtime/app.runtime';

type SttStatus = 'idle' | 'streaming' | 'processing';

interface UseSttReturn {
    readonly status: SttStatus;
    readonly transcription: string;
    readonly partialTranscription: string;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly startStream: () => Effect.Effect<boolean, unknown, AppServices>;
    readonly insertAudio: (samples: Float32Array) => void;
    readonly stopStream: () => Effect.Effect<string, never, AppServices>;
    readonly cancelStream: () => void;
}

const sttWithDownloadAtom = Atom.make(get => ({
    ...get(sttSnapshotAtom),
    downloadProgress: sumAiModelDownloadBytes([get(aiModelDownloadSnapshotAtom).models[AiSubsystemNameEnum.STT]]).ratio
}));

export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();

    const sttSnapshot = useAtomValue(sttWithDownloadAtom);

    const [status, setStatus] = useState<SttStatus>('idle');
    const [baseTranscription, setBaseTranscription] = useState('');
    const streamGenerationRef = useRef(0);
    const { acquireSttResidency, releaseSttResidency } = useSttResidency();

    const startStream = () =>
        Effect.gen(function* () {
            streamGenerationRef.current += 1;
            const generation = streamGenerationRef.current;
            const language = isSpeechToTextLanguage(locale.languageCode) ? locale.languageCode : null;

            if (!(yield* acquireSttResidency()) || generation !== streamGenerationRef.current) {
                return false;
            }

            yield* Effect.ignore(Effect.flatMap(SttService, sttService => sttService.stopStream(false)));
            setBaseTranscription(appAtomRegistry.get(sttSnapshotAtom).committedTranscription);
            const isStreaming = yield* Effect.isSuccess(Effect.flatMap(SttService, sttService => sttService.streamStart(language)));
            const isCurrentGeneration = generation === streamGenerationRef.current;

            if (!isStreaming && isCurrentGeneration) {
                releaseSttResidency();
            }

            if (!isStreaming || !isCurrentGeneration) {
                return false;
            }

            setStatus('streaming');

            return true;
        });

    const insertAudio = (samples: Float32Array) => {
        if (status !== 'streaming') {
            return;
        }

        appRuntime.runFork(Effect.map(SttService, sttService => void sttService.streamInsert(samples)));
    };

    const committedTranscription = sttSnapshot.committedTranscription.startsWith(baseTranscription)
        ? sttSnapshot.committedTranscription.slice(baseTranscription.length)
        : sttSnapshot.committedTranscription;
    const transcription = filterTranscriptionTokens(committedTranscription);
    const partialTranscription = filterTranscriptionTokens(sttSnapshot.nonCommittedTranscription);

    const stopStream = () =>
        Effect.suspend(() => {
            const generation = streamGenerationRef.current;

            setStatus('processing');

            return Effect.flatMap(SttService, sttService => sttService.stopStream(true)).pipe(
                Effect.map(text => filterTranscriptionTokens(text).trim()),
                Effect.catch(() => Effect.die(new Error(t`Transcription failed`))),
                Effect.ensuring(
                    Effect.sync(() => {
                        releaseSttResidency();
                        if (generation === streamGenerationRef.current) {
                            setStatus('idle');
                        }
                    })
                )
            );
        });

    const cancelStream = () => {
        streamGenerationRef.current += 1;
        setStatus('idle');
        appRuntime.runFork(Effect.ignore(Effect.flatMap(SttService, sttService => sttService.stopStream(false))));
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
