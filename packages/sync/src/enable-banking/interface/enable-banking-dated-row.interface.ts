import type { EnableBankingTransactionApiInterface } from './enable-banking-transaction-api.schema';

export interface EnableBankingDatedRowInterface {
    readonly transaction: EnableBankingTransactionApiInterface;
    readonly bookedOn: string;
    readonly operatedAtMs: number;
    readonly contentHash: string;
}
