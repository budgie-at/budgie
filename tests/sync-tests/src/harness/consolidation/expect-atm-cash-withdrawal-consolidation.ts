import { CategorizeInboxCashService } from '@app/categorize-inbox/service/categorize-inbox-cash.service';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { testQueryService } from '../db/test-query-service';

export const expectAtmCashWithdrawalConsolidation = Effect.fnUntraced(function* (
    sourceAccountId: number,
    cashAccountId: number,
    sourceTransactionId: number
) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const categorizeInboxService = yield* CategorizeInboxCashService;

    yield* transferConsolidationService.consolidate(null);

    expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
    expect(yield* categorizeInboxService.moveToCash([sourceTransactionId])).toEqual([sourceTransactionId]);

    const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(canonicals[0].toAccountId).toBe(cashAccountId);
    expect((yield* testQueryService.findTransactionById(sourceTransactionId)).consolidationParentTransactionId).toBe(canonicals[0].id);
});
