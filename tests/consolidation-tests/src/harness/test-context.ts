import { buildTestDb, createTestRepositories, TestQueryService, TestSeedService } from '@budgie-at/test-kit';
import {
    ConsolidationAutoCandidateService,
    ConsolidationExecutorService,
    ConsolidationFamilyRegistryService,
    ConsolidationRepairExecutorService,
    RefundConsolidationService,
    UnconsolidationService
} from '@budgie/consolidation';

import type { DB } from '@budgie/contracts';

export const testDb = buildTestDb();

const repositories = createTestRepositories(testDb);
const runTestTransaction = <T>(database: DB, callback: (transactionDatabase: DB) => Promise<T>): Promise<T> => callback(database);
const yieldControl = (): Promise<void> => Promise.resolve();

export const accountBalanceRepository = repositories.accountBalanceRepository;
export const accountRepository = repositories.accountRepository;
export const atmCashWithdrawalRepository = repositories.atmCashWithdrawalRepository;
export const existingTransferRepository = repositories.existingTransferRepository;
export const ibanBridgeTransferRepository = repositories.ibanBridgeTransferRepository;
export const refundPairRepository = repositories.refundPairRepository;
export const transferPairRepository = repositories.transferPairRepository;
export const transactionRepository = repositories.transactionRepository;

const consolidationExecutorDependencies = {
    database: testDb,
    runTransaction: runTestTransaction,
    transactionRepository: repositories.transactionRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
};

export const consolidationExecutorService = new ConsolidationExecutorService(consolidationExecutorDependencies);

export const consolidationRepairExecutorService = new ConsolidationRepairExecutorService(consolidationExecutorDependencies);

const consolidationFamilyRegistryService = new ConsolidationFamilyRegistryService(
    {
        atmCashWithdrawalRepository: repositories.atmCashWithdrawalRepository,
        existingTransferRepository: repositories.existingTransferRepository,
        ibanBridgeTransferRepository: repositories.ibanBridgeTransferRepository,
        refundPairRepository: repositories.refundPairRepository,
        transferPairRepository: repositories.transferPairRepository
    },
    consolidationExecutorService,
    consolidationRepairExecutorService,
    yieldControl
);

export const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationFamilyRegistryService);

export const unconsolidationService = new UnconsolidationService({
    transactionRepository: repositories.transactionRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const refundConsolidationService = new RefundConsolidationService({
    database: testDb,
    refundPairRepository: repositories.refundPairRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionRepository: repositories.transactionRepository,
    runTransaction: runTestTransaction,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const testQueryService = new TestQueryService(testDb);

export const testSeedService = new TestSeedService(testDb);
