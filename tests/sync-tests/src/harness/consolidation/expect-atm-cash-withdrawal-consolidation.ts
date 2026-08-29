import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { fetchCanonicalsOfType } from '../db/fetch-canonicals-of-type';
import { fetchTransactionById } from '../db/fetch-transaction-by-id';

export const expectAtmCashWithdrawalConsolidation = async (
    sourceAccountId: number,
    cashAccountId: number,
    sourceTransactionId: number
): Promise<void> => {
    const result = await transferConsolidationService.consolidate();

    expect(result.consolidated).toBe(1);

    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(canonicals[0].toAccountId).toBe(cashAccountId);
    expect(fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicals[0].id);
};
