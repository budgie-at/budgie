import { RecordButtonStateType } from '../type/record-button-state.type';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'done' | 'error';

export const VOICE_INPUT_STATE_TO_BUTTON: Record<VoiceInputState, RecordButtonStateType> = {
    idle: 'idle',
    recording: 'recording',
    transcribing: 'transcribing',
    processing: 'thinking',
    done: 'thinking',
    error: 'idle'
};
