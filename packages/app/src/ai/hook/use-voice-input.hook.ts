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
import { VoiceInputActionInterface } from '../interface/voice-input-action.interface';
import { VoiceInputReducerStateInterface } from '../interface/voice-input-reducer-state.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

const INITIAL_STATE: VoiceInputReducerStateInterface = {
    status: VoiceInputStateEnum.IDLE,
    error: null,
    finalTranscription: '',
    hasBeenReady: false
};

const reducer = (state: VoiceInputReducerStateInterface, action: VoiceInputActionInterface): VoiceInputReducerStateInterface => {
    if (action.type === VoiceInputActionTypeEnum.STT_BECAME_READY) {
        return { ...state, hasBeenReady: true };
    }
    if (action.type === VoiceInputActionTypeEnum.SESSION_STARTED) {
        return { ...state, error: null, finalTranscription: '' };
    }
    if (action.type === VoiceInputActionTypeEnum.RECORDING_STARTED) {
        return { ...state, status: VoiceInputStateEnum.RECORDING };
    }
    if (action.type === VoiceInputActionTypeEnum.TRANSCRIBING_STARTED) {
        return { ...state, status: VoiceInputStateEnum.TRANSCRIBING };
    }
    if (action.type === VoiceInputActionTypeEnum.PIPELINE_COMPLETED) {
        return { ...state, status: VoiceInputStateEnum.DONE };
    }
    if (action.type === VoiceInputActionTypeEnum.PROCESSING_STARTED) {
        return { ...state, status: VoiceInputStateEnum.PROCESSING, finalTranscription: action.transcription };
    }
    if (action.type === VoiceInputActionTypeEnum.PIPELINE_FAILED) {
        return { ...state, status: VoiceInputStateEnum.ERROR, error: action.error };
    }

    return { ...state, status: VoiceInputStateEnum.IDLE, error: null, finalTranscription: '' };
};

// eslint-disable-next-line max-statements -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturnInterface => {
    const [{ status: state, error, finalTranscription, hasBeenReady }, dispatch] = useReducer(reducer, INITIAL_STATE);

    const resultRef = useRef<Parameters<UseVoiceInputReturnInterface['startAndCollect']>[0] | null>(null);

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

    const handleError = (e: unknown) => {
        dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_FAILED, error: getRootErrorMessage(e) });
        settle([], '');
    };

    const runPipeline = () =>
        Effect.gen(function* () {
            dispatch({ type: VoiceInputActionTypeEnum.TRANSCRIBING_STARTED });
            const text = yield* stt.stopStream();

            if (!isNotEmptyString(text)) {
                dispatch({ type: VoiceInputActionTypeEnum.RESET });
                settle([], '');

                return;
            }

            dispatch({ type: VoiceInputActionTypeEnum.PROCESSING_STARTED, transcription: text });

            const transactions = yield* categorization.categorize(text);

            dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_COMPLETED });
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
            dispatch({ type: VoiceInputActionTypeEnum.SESSION_STARTED });
            categorization.reset();
            resultRef.current = onResult;

            if (!(yield* stt.startStream())) {
                settle([], '');

                return;
            }

            recording.start();
            dispatch({ type: VoiceInputActionTypeEnum.RECORDING_STARTED });
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
        dispatch({ type: VoiceInputActionTypeEnum.RESET });
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
