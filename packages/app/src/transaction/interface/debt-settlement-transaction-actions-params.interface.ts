import { AccountDebtTypeEnum } from '@budgie/contracts';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface DebtSettlementTransactionActionsParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly transactionAccountId?: number | null;
    readonly debtType: AccountDebtTypeEnum;
    readonly emptyStateDescription: string;
    readonly attachErrorMessage: string;
    readonly detachErrorMessage: string;
}
