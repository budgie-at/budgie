import { AITransactionInterface } from '@budgie/ai';

import { VoiceTranscriptionInterface } from './voice-transcription.interface';

export interface VoiceInputDataInterface {
    readonly transcription: VoiceTranscriptionInterface;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly audioLevel: number;
}
