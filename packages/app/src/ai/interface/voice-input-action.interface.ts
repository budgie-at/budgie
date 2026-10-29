import { VoiceInputActionTypeEnum } from '../enum/voice-input-action-type.enum';

export type VoiceInputActionInterface =
    | { readonly type: VoiceInputActionTypeEnum.PROCESSING_STARTED; readonly transcription: string }
    | { readonly type: VoiceInputActionTypeEnum.PIPELINE_FAILED; readonly error: string }
    | {
          readonly type: Exclude<
              VoiceInputActionTypeEnum,
              VoiceInputActionTypeEnum.PROCESSING_STARTED | VoiceInputActionTypeEnum.PIPELINE_FAILED
          >;
      };
