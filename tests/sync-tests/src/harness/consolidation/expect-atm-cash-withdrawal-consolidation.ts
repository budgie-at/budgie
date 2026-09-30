import { categorizeInboxService } from '@app/categorize-inbox/service/categorize-inbox.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { fetchCanonicalsOfType } from '../db/fetch-canonicals-of-type';
import { fetchTransactionById } from '../db/fetch-transaction-by-id';

export const expectAtmCashWithdrawalConsolidation = Effect.fnUntraced(function* (
    sourceAccountId: number,
    cashAccountId: number,
    sourceTransactionId: number
) {
    yield* transferConsolidationService.consolidate(null);

    expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
    expect(yield* categorizeInboxService.moveToCash([sourceTransactionId])).toEqual([sourceTransactionId]);

    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(canonicals[0].toAccountId).toBe(cashAccountId);
    expect(fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicals[0].id);
});
