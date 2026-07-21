import type { DB } from '@budgie/contracts';

export interface CreateOpeningDebtTransferParamsInterface {
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly fromAmount: number;
    readonly toAmount: number;
    readonly exchangeRate: number;
    readonly operatedAt: Date;
    readonly title: string;
    readonly tx: DB;
}
