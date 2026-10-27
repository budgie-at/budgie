import { AITransactionInterface } from '@budgie/ai';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { UseVoiceInputReturnInterface } from '../interface/use-voice-input-return.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

// eslint-disable-next-line max-statements, max-lines-per-function -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturnInterface => {
    const [state, setState] = useState<VoiceInputStateEnum>(VoiceInputStateEnum.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');
    const [hasBeenReady, setHasBeenReady] = useState(false);

    const resultRef = useRef<Parameters<UseVoiceInputReturnInterface['startAndCollect']>[0] | null>(null);

    const stt = useStt();
    const categorization = useLlmCategorization();

    if (stt.isReady && !hasBeenReady) {
        setHasBeenReady(true);
    }

    const settle = (transactions: AITransactionInterface[], originalText: string) => {
        const callback = resultRef.current;
        resultRef.current = null;
        callback?.(transactions, originalText);
    };

    const handleError = (e: unknown) => {
        setError(getRootErrorMessage(e));
        setState(VoiceInputStateEnum.ERROR);
        settle([], '');
    };

    const runPipeline = () =>
        Effect.gen(function* () {
            setState(VoiceInputStateEnum.TRANSCRIBING);
            const text = yield* stt.stopStream();

            if (!isNotEmptyString(text)) {
                setState(VoiceInputStateEnum.IDLE);
                settle([], '');

                return;
            }

            setFinalTranscription(text);
            setState(VoiceInputStateEnum.PROCESSING);

            const transactions = yield* categorization.categorize(text);

            setState(VoiceInputStateEnum.DONE);
            settle(transactions, text);
        });

    const runPipelineOnce = () => {
        appRuntime.runFork(
            logAndContinue(runPipeline().pipe(Effect.tapCause(cause => Effect.sync(() => void handleError(Cause.squash(cause))))))
        );
    };

    const recording = useRecording({
        onAudioBuffer: stt.insertAudio,
        onSilenceDetected: runPipelineOnce
    });

    const startAndCollect: UseVoiceInputReturnInterface['startAndCollect'] = onResult =>
        Effect.gen(function* () {
            setError(null);
            setFinalTranscription('');
            categorization.reset();
            resultRef.current = onResult;

            if (!(yield* stt.startStream())) {
                settle([], '');

                return;
            }

            recording.start();
            setState(VoiceInputStateEnum.RECORDING);
        });

    const stop = () => {
        if (state !== VoiceInputStateEnum.RECORDING) {
            return;
        }
        recording.stop();
        runPipelineOnce();
    };

    const cancel = () => {
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        resultRef.current = null;
        setState(VoiceInputStateEnum.IDLE);
        setError(null);
        setFinalTranscription('');
    };

    const transcription =
        state === VoiceInputStateEnum.PROCESSING || state === VoiceInputStateEnum.DONE
            ? { committed: finalTranscription, partial: '' }
            : { committed: stt.transcription, partial: stt.partialTranscription };

    return {
        state,
        data: {
            transcription,
            transactions: categorization.transactions,
            error,
            audioLevel: recording.audioLevel
        },
        isReady: hasBeenReady,
        downloadProgress: stt.downloadProgress,
        startAndCollect,
        stop,
        cancel
    };
};
