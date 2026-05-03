import { AITransactionInterface } from '@budgie/ai';

export interface VoiceInputCollectionInterface {
    readonly transactions: AITransactionInterface[];
    readonly originalText: string;
}
