import { VoiceInputActionTypeEnum } from '../enum/voice-input-action-type.enum';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { VoiceInputActionInterface } from '../interface/voice-input-action.interface';
import { VoiceInputReducerStateInterface } from '../interface/voice-input-reducer-state.interface';

export const voiceInputReducer = (
    state: VoiceInputReducerStateInterface,
    action: VoiceInputActionInterface
): VoiceInputReducerStateInterface => {
    if (action.type === VoiceInputActionTypeEnum.STT_BECAME_READY) {
        return { ...state, hasBeenReady: true };
    }
    if (action.type === VoiceInputActionTypeEnum.SESSION_STARTED) {
        return { ...state, status: VoiceInputStateEnum.IDLE, error: null, finalTranscription: '' };
    }
    if (action.type === VoiceInputActionTypeEnum.RECORDING_STARTED) {
        return { ...state, status: VoiceInputStateEnum.RECORDING };
    }
    if (action.type === VoiceInputActionTypeEnum.TRANSCRIBING_STARTED) {
        return state.status === VoiceInputStateEnum.RECORDING ? { ...state, status: VoiceInputStateEnum.TRANSCRIBING } : state;
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
