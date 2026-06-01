import { UnconsolidationService } from '@budgie/consolidation';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { DB } from '@budgie/contracts';

const unconsolidationService = new UnconsolidationService({
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
});

export const unconsolidateByIdInTransaction = async (transactionId: number, tx: DB): Promise<void> => {
    await unconsolidationService.unconsolidateById(transactionId, tx);
};
