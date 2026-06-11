import {
    ConsolidationAutoCandidateService,
    ConsolidationCandidateService,
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationFamilyRegistryService,
    ConsolidationRepairExecutorService
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

const consolidationExecutorDependencies = {
    database: db,
    runTransaction: transactionAsync,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
};

const consolidationExecutorService = new ConsolidationExecutorService(consolidationExecutorDependencies);

const consolidationRepairExecutorService = new ConsolidationRepairExecutorService(consolidationExecutorDependencies);

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
    consolidationRepairExecutorService,
    microPause
);

const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationFamilyRegistryService);

export const consolidationCoordinatorService = new ConsolidationCoordinatorService(
    consolidationCandidateService,
    consolidationAutoCandidateService
);
