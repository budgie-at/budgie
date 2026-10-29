import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';

export interface VoiceInputReducerStateInterface {
    readonly status: VoiceInputStateEnum;
    readonly error: string | null;
    readonly finalTranscription: string;
    readonly hasBeenReady: boolean;
}
