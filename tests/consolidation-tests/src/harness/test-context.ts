import {
    ConsolidationAutoCandidateService,
    ConsolidationCandidateService,
    ConsolidationExecutorService,
    RefundConsolidationService,
    UnconsolidationService
} from '@budgie/consolidation';

import { buildTestDb, createTestRepositories, createTestTransactionRunner, TestQueryService, TestSeedService } from '@budgie-at/test-kit';

export const testDb = buildTestDb();

const repositories = createTestRepositories(testDb);
const transactionRunner = createTestTransactionRunner();

export const accountBalanceRepository = repositories.accountBalanceRepository;
export const accountRepository = repositories.accountRepository;
export const refundPairRepository = repositories.refundPairRepository;

export const consolidationExecutorService = new ConsolidationExecutorService({
    database: testDb,
    transactionRunner,
    transactionRepository: repositories.transactionRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const consolidationCandidateService = new ConsolidationCandidateService({
    transferPairRepository: repositories.transferPairRepository,
    refundPairRepository: repositories.refundPairRepository
});

export const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationExecutorService);

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
    transactionRunner,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const testQueryService = new TestQueryService(testDb);

export const testSeedService = new TestSeedService(testDb);
