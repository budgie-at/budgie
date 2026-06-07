import {
    ConsolidationAutoCandidateService,
    ConsolidationCandidateService,
    ConsolidationCoordinatorService,
    ConsolidationExecutorService
} from '@budgie/consolidation';
import { transactionAsync } from '@budgie/contracts';

import {
    db,
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository,
    transferPairRepository
} from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';

const consolidationExecutorService = new ConsolidationExecutorService({
    database: db,
    transactionEntryRepository,
    transactionRepository,
    transactionRunner: { run: transactionAsync },
    transactionTagsRepository
});

const consolidationCandidateService = new ConsolidationCandidateService(
    {
        refundPairRepository,
        transferPairRepository
    },
    microPause
);

const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationExecutorService, microPause);

export const consolidationCoordinatorService = new ConsolidationCoordinatorService(
    consolidationCandidateService,
    consolidationAutoCandidateService
);
