import { VoiceInputActionTypeEnum } from '../enum/voice-input-action-type.enum';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';

export type VoiceInputActionInterface =
    | { readonly type: VoiceInputActionTypeEnum.STT_BECAME_READY }
    | { readonly type: VoiceInputActionTypeEnum.SESSION_STARTED }
    | { readonly type: VoiceInputActionTypeEnum.STATUS_CHANGED; readonly status: VoiceInputStateEnum }
    | { readonly type: VoiceInputActionTypeEnum.PROCESSING_STARTED; readonly transcription: string }
    | { readonly type: VoiceInputActionTypeEnum.PIPELINE_FAILED; readonly error: string }
    | { readonly type: VoiceInputActionTypeEnum.CANCELLED };
