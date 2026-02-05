import { TransactionTypeEnum } from '@budgie/contracts';

export interface ConvertToTransferParamsInterface {
    readonly id: number;
    readonly accountId: number;
    readonly customExchangeRate: number;
    readonly sourceType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}
