import { CurrencyEnum } from '@budgie/contracts';

export interface VoiceReviewRowInterface {
    readonly id: string;
    readonly amountMicroUnits: number;
    readonly currency: CurrencyEnum | null;
    readonly description: string;
    readonly accountId: number | null;
    readonly categoryId: number | null;
}
