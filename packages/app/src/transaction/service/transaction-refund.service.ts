import { RefundConsolidationService } from '@budgie/consolidation';

import {
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';

export const transactionRefundService = new RefundConsolidationService({
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
});
