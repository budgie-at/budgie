import { expect } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { testQueryService } from './test-context';

export const expectRefundCanonicalTags = (transactionId: number, tagIds: number[]): void => {
    expect(testQueryService.fetchTransactionById(transactionId).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    expect(testQueryService.fetchTransactionTagIds(transactionId)).toEqual(tagIds);
};
