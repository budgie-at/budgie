import type { ExternalSourceEnum } from '@budgie/contracts';

export interface CrossCurrencyTransferSeedInputInterface {
    readonly incomeAmount?: number;
    readonly incomeDelaySeconds?: number;
    readonly expenseExchangeRate?: number;
    readonly incomeExchangeRate?: number;
    readonly isTransferMcc?: boolean;
    readonly receivingBank?: ExternalSourceEnum;
}
