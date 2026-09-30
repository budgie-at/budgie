import { buildTestDb, createTestRepositories, runWithDb, TestQueryService, TestSeedService } from '@budgie-at/test-kit';
import {
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationRepairExecutorService,
    P2pFiatDirectionEnum,
    RefundConsolidationService,
    UnconsolidationService
} from '@budgie/consolidation';
import { Db } from '@budgie/contracts';

export const testDb = buildTestDb();

const repositories = createTestRepositories(testDb);
export const runEffect = runWithDb(testDb);

export const { accountBalanceRepository } = repositories;
export const { accountRepository } = repositories;
export const { atmCashWithdrawalRepository } = repositories;
export const { existingTransferRepository } = repositories;
export const { ibanBridgeTransferRepository } = repositories;
export const { refundPairRepository } = repositories;
export const { statisticsRepository } = repositories;
export const { transferPairRepository } = repositories;

const consolidationExecutorDependencies = {
    resolveP2pTransferTitle: (direction: P2pFiatDirectionEnum, assetCode: string): string =>
        direction === P2pFiatDirectionEnum.BUY ? `Binance P2P buy ${assetCode}` : `Binance P2P sell ${assetCode}`,
    transactionRepository: repositories.transactionRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
};

export const consolidationExecutorService = new ConsolidationExecutorService(consolidationExecutorDependencies);

export const consolidationRepairExecutorService = new ConsolidationRepairExecutorService(consolidationExecutorDependencies);

export const consolidationCoordinatorService = new ConsolidationCoordinatorService(
    {
        atmCashWithdrawalRepository: repositories.atmCashWithdrawalRepository,
        existingTransferRepository: repositories.existingTransferRepository,
        ibanBridgeTransferRepository: repositories.ibanBridgeTransferRepository,
        refundPairRepository: repositories.refundPairRepository,
        transferPairRepository: repositories.transferPairRepository
    },
    consolidationExecutorService,
    consolidationRepairExecutorService
);

const unconsolidationService = new UnconsolidationService({
    transactionRepository: repositories.transactionRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const refundConsolidationService = new RefundConsolidationService({
    refundPairRepository: repositories.refundPairRepository,
    transactionEntryRepository: repositories.transactionEntryRepository,
    transactionRepository: repositories.transactionRepository,
    transactionTagsRepository: repositories.transactionTagsRepository
});

export const testQueryService = new TestQueryService(testDb);

export const testSeedService = new TestSeedService(testDb);

export const unconsolidateById = (transactionId: number) =>
    runEffect(Db.transaction(unconsolidationService.unconsolidateById(transactionId)));
