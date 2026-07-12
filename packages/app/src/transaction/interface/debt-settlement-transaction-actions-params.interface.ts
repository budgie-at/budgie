import { AccountDebtTypeEnum } from '@budgie/contracts';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface DebtSettlementTransactionActionsParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly transactionAccountId?: number | null;
    readonly debtType?: AccountDebtTypeEnum;
}
