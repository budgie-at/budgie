import { AITransactionInterface } from '@budgie/ai';
import { logAndContinue } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useEffect, useEffectEvent, useReducer, useRef } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { useProcessingHaptic } from '../../@generic/hook/use-processing-haptic.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { VoiceInputActionTypeEnum } from '../enum/voice-input-action-type.enum';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { UseVoiceInputReturnInterface } from '../interface/use-voice-input-return.interface';
import { VoiceInputActionInterface } from '../interface/voice-input-action.interface';
import { VoiceInputReducerStateInterface } from '../interface/voice-input-reducer-state.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { voiceInputReducer } from '../utils/voice-input-reducer.util';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Fiber from 'effect/Fiber';

const INITIAL_STATE: VoiceInputReducerStateInterface = {
    status: VoiceInputStateEnum.IDLE,
    error: null,
    finalTranscription: '',
    hasBeenReady: false
};

const runVoicePipeline = (
    stopStream: () => Effect.Effect<string, never, AppServices>,
    categorize: (text: string) => Effect.Effect<AITransactionInterface[], Cause.YieldableError, AppServices>,
    dispatch: (action: VoiceInputActionInterface) => void,
    onComplete: (transactions: AITransactionInterface[], text: string) => void
) =>
    Effect.gen(function* () {
        dispatch({ type: VoiceInputActionTypeEnum.TRANSCRIBING_STARTED });
        const text = yield* stopStream();

        if (isNotEmptyString(text)) {
            dispatch({ type: VoiceInputActionTypeEnum.PROCESSING_STARTED, transcription: text });
            const transactions = yield* categorize(text);
            dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_COMPLETED });
            onComplete(transactions, text);
        } else {
            dispatch({ type: VoiceInputActionTypeEnum.RESET });
            onComplete([], '');
        }
    });

const handlePipelineError = (
    cause: Cause.Cause<unknown>,
    hapticNotification: (type?: NotificationFeedbackType) => void,
    dispatch: (action: VoiceInputActionInterface) => void,
    onReset: () => void
) => {
    if (Cause.hasInterruptsOnly(cause)) {
        return;
    }

    hapticNotification(NotificationFeedbackType.Error);
    dispatch({ type: VoiceInputActionTypeEnum.PIPELINE_FAILED, error: cause.pipe(Cause.squash, getRootErrorMessage) });
    onReset();
};

const getVoiceTranscription = (
    state: VoiceInputStateEnum,
    finalTranscription: string,
    stt: Pick<ReturnType<typeof useStt>, 'transcription' | 'partialTranscription'>
) =>
    state === VoiceInputStateEnum.PROCESSING || state === VoiceInputStateEnum.DONE
        ? { committed: finalTranscription, partial: '' }
        : { committed: stt.transcription, partial: stt.partialTranscription };

// eslint-disable-next-line max-statements -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturnInterface => {
    const [{ status: state, error, finalTranscription, hasBeenReady }, dispatch] = useReducer(voiceInputReducer, INITIAL_STATE);

    const resultRef = useRef<Parameters<UseVoiceInputReturnInterface['startAndCollect']>[0] | null>(null);
    const isPipelineRunningRef = useRef(false);
    const pipelineFiberRef = useRef<Fiber.Fiber<void> | null>(null);
    const [hapticNotification] = useVibration();
    const stt = useStt();
    const categorization = useLlmCategorization();

    useProcessingHaptic(state === VoiceInputStateEnum.TRANSCRIBING || state === VoiceInputStateEnum.PROCESSING);

    if (stt.isReady && !hasBeenReady) {
        dispatch({ type: VoiceInputActionTypeEnum.STT_BECAME_READY });
    }

    const interruptPipeline = () => {
        pipelineFiberRef.current?.interruptUnsafe();
        pipelineFiberRef.current = null;
        isPipelineRunningRef.current = false;
    };

    const handleUnmount = useEffectEvent(interruptPipeline);

    useEffect(() => () => void handleUnmount(), []);

    const settle = (transactions: AITransactionInterface[], originalText: string) => {
        const callback = resultRef.current;
        resultRef.current = null;
        callback?.(transactions, originalText);
    };

    const handleComplete = (transactions: AITransactionInterface[], text: string) => {
        if (isNotEmptyString(text)) {
            hapticNotification(NotificationFeedbackType.Success);
        }
        settle(transactions, text);
    };

    const runPipelineOnce = () => {
        if (!isPipelineRunningRef.current) {
            isPipelineRunningRef.current = true;
            pipelineFiberRef.current = appRuntime.runFork(
                logAndContinue(
                    runVoicePipeline(stt.stopStream, categorization.categorize, dispatch, handleComplete).pipe(
                        Effect.tapCause(cause =>
                            Effect.sync(() => void handlePipelineError(cause, hapticNotification, dispatch, () => void settle([], '')))
                        )
                    )
                )
            );
        }
    };

    const recording = useRecording({ onAudioBuffer: stt.insertAudio, onSilenceDetected: runPipelineOnce });

    const startAndCollect: UseVoiceInputReturnInterface['startAndCollect'] = onResult =>
        Effect.gen(function* () {
            interruptPipeline();
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
        interruptPipeline();
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        resultRef.current = null;
        dispatch({ type: VoiceInputActionTypeEnum.RESET });
    };

    const transcription = getVoiceTranscription(state, finalTranscription, stt);

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
