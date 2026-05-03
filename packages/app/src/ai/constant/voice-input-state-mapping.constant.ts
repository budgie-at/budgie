import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { RecordButtonStateType } from '../type/record-button-state.type';

export const VOICE_INPUT_STATE_TO_BUTTON: Record<VoiceInputStateEnum, RecordButtonStateType> = {
    [VoiceInputStateEnum.IDLE]: 'idle',
    [VoiceInputStateEnum.RECORDING]: 'recording',
    [VoiceInputStateEnum.TRANSCRIBING]: 'transcribing',
    [VoiceInputStateEnum.PROCESSING]: 'thinking',
    [VoiceInputStateEnum.DONE]: 'thinking',
    [VoiceInputStateEnum.ERROR]: 'idle'
};
