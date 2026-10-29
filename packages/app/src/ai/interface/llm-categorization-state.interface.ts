import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';

import type { AITransactionInterface } from '@budgie/ai';

export interface LlmCategorizationStateInterface {
    readonly status: VoiceInputStateEnum;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
}
