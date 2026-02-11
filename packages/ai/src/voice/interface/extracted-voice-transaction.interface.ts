import { CurrencyEnum } from '@budgie/contracts';

export interface ExtractedVoiceTransactionInterface {
    description: string;
    amount: number;
    currency: CurrencyEnum | null;
}
