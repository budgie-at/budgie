import { filterTranscriptionTokens } from '@budgie/ai';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sttService } from '../service/stt.service';
import { isSpeechToTextLanguage } from '../type-guard/is-speech-to-text-language.type-guard';
import { aiLog } from '../utils/ai-log.util';

import { useStartStopStt } from './use-start-stop-stt.hook';
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

const INSERT_LOG_INTERVAL = 50;

// eslint-disable-next-line max-statements
export const useStt = (): UseSttReturn => {
    const { t } = useLingui();
    const locale = useLocaleInfo();

    useStartStopStt();
    const sttSnapshot = useSttSnapshot();

    const [status, setStatus] = useState<SttStatus>('idle');
    const [transcription, setTranscription] = useState('');
    const [partialTranscription, setPartialTranscription] = useState('');

    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const baseTranscriptionRef = useRef('');
    const insertLogTickRef = useRef(0);

    const updateTranscription = () => {
        const committed = sttService.committedTranscription;
        const currentCommitted = committed.startsWith(baseTranscriptionRef.current)
            ? committed.slice(baseTranscriptionRef.current.length)
            : committed;

        setTranscription(filterTranscriptionTokens(currentCommitted));
        setPartialTranscription(filterTranscriptionTokens(sttService.nonCommittedTranscription));
    };

    const resetState = () => {
        setStatus('idle');
        setTranscription('');
        setPartialTranscription('');
    };

    const cleanupStream = async () => {
        if (isDefined(streamPromiseRef.current)) {
            try {
                sttService.streamStop();
                await streamPromiseRef.current;
            } catch {
                emptyFn();
            } finally {
                // eslint-disable-next-line require-atomic-updates
                streamPromiseRef.current = null;
            }
        }
    };

    const initStream = () => {
        resetState();
        baseTranscriptionRef.current = sttService.committedTranscription;
        const streamOptions = isSpeechToTextLanguage(locale.languageCode) ? { language: locale.languageCode } : {};
        streamPromiseRef.current = sttService.stream(streamOptions).catch(() => '');
        setStatus('streaming');
    };

    const startStream = () => {
        aiLog('hook:stt:startStream');
        cleanupStream().then(initStream).catch(emptyFn);
    };

    const insertAudio = (samples: Float32Array) => {
        if (status !== 'streaming') {
            return;
        }

        sttService.streamInsert(samples);
        updateTranscription();
        insertLogTickRef.current += 1;
        if (insertLogTickRef.current % INSERT_LOG_INTERVAL === 0) {
            aiLog('hook:stt:insert', { ticks: insertLogTickRef.current, samplesLen: samples.length });
        }
    };

    const stopStream = async (): Promise<string> => {
        aiLog('hook:stt:stopStream');
        if (!isDefined(streamPromiseRef.current)) {
            return transcription;
        }

        setStatus('processing');

        try {
            sttService.streamStop();
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
        aiLog('hook:stt:cancelStream');
        cleanupStream().then(resetState).catch(emptyFn);
    };

    return {
        status,
        transcription,
        partialTranscription,
        isReady: sttSnapshot.status === AiSubsystemStatusEnum.Ready,
        downloadProgress: sttSnapshot.downloadProgress,
        startStream,
        insertAudio,
        stopStream,
        cancelStream
    };
};
