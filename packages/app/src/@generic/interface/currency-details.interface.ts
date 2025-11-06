import { CurrencyEnum } from '@budgie/contracts';

export interface CurrencyDetails {
    code: CurrencyEnum;
    symbol: string;
    emoji: string;
    name: string;
}
