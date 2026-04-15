import { TransactionTypeEnum } from '@budgie/contracts';

export interface TransferConversionResultInterface {
    readonly creditAccountId: number;
    readonly creditAmount: number;
    readonly debitAccountId: number;
    readonly debitAmount: number;
    readonly exchangeRate: number;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly transactionType: TransactionTypeEnum;
}
