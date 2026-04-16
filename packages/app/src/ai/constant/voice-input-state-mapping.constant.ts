import { RecordButtonStateType } from '../type/record-button-state.type';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

export const VOICE_INPUT_STATE_TO_BUTTON: Record<VoiceInputState, RecordButtonStateType> = {
    idle: 'idle',
    recording: 'recording',
    transcribing: 'transcribing',
    confirming: 'confirm',
    processing: 'thinking',
    done: 'idle',
    error: 'idle'
};
