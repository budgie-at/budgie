import {
    ConsolidationAutoCandidateService,
    ConsolidationCandidateService,
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationFamilyRegistryService
} from '@budgie/consolidation';
import { transactionAsync } from '@budgie/contracts';

import {
    atmCashWithdrawalRepository,
    db,
    existingTransferRepository,
    ibanBridgeTransferRepository,
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
        atmCashWithdrawalRepository,
        existingTransferRepository,
        refundPairRepository,
        transferPairRepository
    },
    microPause
);

const consolidationFamilyRegistryService = new ConsolidationFamilyRegistryService(
    {
        atmCashWithdrawalRepository,
        existingTransferRepository,
        ibanBridgeTransferRepository,
        refundPairRepository,
        transferPairRepository
    },
    consolidationExecutorService,
    microPause
);

const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationFamilyRegistryService);

export const consolidationCoordinatorService = new ConsolidationCoordinatorService(
    consolidationCandidateService,
    consolidationAutoCandidateService
);
