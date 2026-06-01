import { ConsolidationExecutorService } from '@budgie/consolidation';
import { transactionAsync } from '@budgie/contracts';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

export const transferConsolidationExecutorService = new ConsolidationExecutorService({
    database: db,
    transactionEntryRepository,
    transactionRepository,
    transactionRunner: { run: transactionAsync },
    transactionTagsRepository
});
