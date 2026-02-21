import { CurrencyEnum } from '@budgie/contracts';

export interface ExtractedVoiceTransactionInterface {
    readonly description: string;
    readonly amount: number;
    readonly currency: CurrencyEnum | null;
}
