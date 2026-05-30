import { expect } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType } from '../db/fetch-canonicals-of-type';
import { fetchTransactionById } from '../db/fetch-transaction-by-id';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const expectTransferPairConsolidation = async (expenseId: number, incomeId: number): Promise<void> => {
    const result = await transferConsolidationService.consolidate();

    expect(result.consolidated).toBe(1);

    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    expect(canonicals).toHaveLength(1);
    expect(fetchTransactionById(expenseId).consolidationParentTransactionId).toBe(canonicals[0].id);
    expect(fetchTransactionById(incomeId).consolidationParentTransactionId).toBe(canonicals[0].id);
};
