import { AccountDebtTypeEnum } from '@budgie/contracts';

import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { UseFormReturn } from 'react-hook-form';

export interface DebtSettlementTransactionActionsParamsInterface {
    readonly form: Pick<UseFormReturn<TransactionCreateInputInterface>, 'control' | 'getValues' | 'setValue'>;
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly transactionAccountId?: number | null;
    readonly debtType?: AccountDebtTypeEnum;
}
