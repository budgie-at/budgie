import { RefundConsolidationService } from '@budgie/consolidation';
import { transactionAsync } from '@budgie/contracts';

import {
    db,
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';

export const transactionRefundService = new RefundConsolidationService({
    database: db,
    refundPairRepository,
    runTransaction: transactionAsync,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
});
