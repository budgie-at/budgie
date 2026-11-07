import { AITransactionInterface } from '@budgie/ai';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useReducer, useRef } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { VoiceInputActionTypeEnum } from '../enum/voice-input-action-type.enum';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { UseVoiceInputReturnInterface } from '../interface/use-voice-input-return.interface';
import { VoiceInputReducerStateInterface } from '../interface/voice-input-reducer-state.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { voiceInputReducer } from '../utils/voice-input-reducer.util';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

const INITIAL_STATE: VoiceInputReducerStateInterface = {
    status: VoiceInputStateEnum.IDLE,
    error: null,
    finalTranscription: '',
    hasBeenReady: false
};

// eslint-disable-next-line max-statements -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturnInterface => {
    const [{ status: state, error, finalTranscription, hasBeenReady }, dispatch] = useReducer(voiceInputReducer, INITIAL_STATE);

    const resultRef = useRef<Parameters<UseVoiceInputReturnInterface['startAndCollect']>[0] | null>(null);
    const isPipelineRunningRef = useRef(false);
    const stt = useStt();
    const categorization = useLlmCategorization();

    if (stt.isReady && !hasBeenReady) {
        dispatch({ type: VoiceInputActionTypeEnum.STT_BECAME_READY });
    }

    const settle = (transactions: AITransactionInterface[], originalText: string) => {
        const callback = resultRef.current;
        resultRef.current = null;
        callback?.(transactions, originalText);
    };

    const handleError = (cause: Cause.Cause<unknown>) => {
        dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_FAILED, error: cause.pipe(Cause.squash, getRootErrorMessage) });
        settle([], '');
    };

    const runPipeline = () =>
        Effect.gen(function* () {
            dispatch({ type: VoiceInputActionTypeEnum.TRANSCRIBING_STARTED });
            const text = yield* stt.stopStream();

            if (isNotEmptyString(text)) {
                dispatch({ type: VoiceInputActionTypeEnum.PROCESSING_STARTED, transcription: text });

                const transactions = yield* categorization.categorize(text);

                dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_COMPLETED });
                settle(transactions, text);
            } else {
                dispatch({ type: VoiceInputActionTypeEnum.RESET });
                settle([], '');
            }
        });

    const runPipelineOnce = () => {
        if (!isPipelineRunningRef.current) {
            isPipelineRunningRef.current = true;
            appRuntime.runFork(logAndContinue(runPipeline().pipe(Effect.tapCause(cause => Effect.sync(() => void handleError(cause))))));
        }
    };

    const recording = useRecording({ onAudioBuffer: stt.insertAudio, onSilenceDetected: runPipelineOnce });

    const startAndCollect: UseVoiceInputReturnInterface['startAndCollect'] = onResult =>
        Effect.gen(function* () {
            isPipelineRunningRef.current = false;
            dispatch({ type: VoiceInputActionTypeEnum.SESSION_STARTED });
            categorization.reset();
            resultRef.current = onResult;

            if (yield* stt.startStream()) {
                recording.start();
                dispatch({ type: VoiceInputActionTypeEnum.RECORDING_STARTED });
            } else {
                settle([], '');
            }
        });

    const stop = () => {
        if (state === VoiceInputStateEnum.RECORDING) {
            recording.stop();
            runPipelineOnce();
        }
    };

    const cancel = () => {
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        resultRef.current = null;
        dispatch({ type: VoiceInputActionTypeEnum.RESET });
    };

    const transcription =
        state === VoiceInputStateEnum.PROCESSING || state === VoiceInputStateEnum.DONE
            ? { committed: finalTranscription, partial: '' }
            : { committed: stt.transcription, partial: stt.partialTranscription };

    return {
        state,
        data: { transcription, transactions: categorization.transactions, error, audioLevel: recording.audioLevel },
        isReady: hasBeenReady,
        downloadProgress: stt.downloadProgress,
        startAndCollect,
        stop,
        cancel
    };
};
