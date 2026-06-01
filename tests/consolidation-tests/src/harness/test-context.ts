import { ConsolidationAutoCandidateService, ConsolidationCandidateService, ConsolidationExecutorService } from '@budgie/consolidation';

import { buildTestDb, createTestRepositories, createTestTransactionRunner, TestQueryService, TestSeedService } from '@budgie-at/test-kit';

export const testDb = buildTestDb();

const repositories = createTestRepositories(testDb);
const transactionRunner = createTestTransactionRunner();

const consolidationExecutorService = new ConsolidationExecutorService({
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

export const testQueryService = new TestQueryService(testDb);

export const testSeedService = new TestSeedService(testDb);
