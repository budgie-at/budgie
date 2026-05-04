import type { DB } from '@budgie/contracts';

export interface ConvertToTransferParamsInterface {
    readonly transactionId: number;
    readonly targetAccountId: number;
    readonly dbTransaction: DB;
}
