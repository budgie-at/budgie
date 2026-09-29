import { UnconsolidationService } from '@budgie/consolidation';
import { Db } from '@budgie/contracts';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

const unconsolidationService = new UnconsolidationService({
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
});

export const unconsolidateByIdInTransaction = (transactionId: number) =>
    Db.transaction(unconsolidationService.unconsolidateById(transactionId));
