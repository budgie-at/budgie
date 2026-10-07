import { buildTestDb, makeTestPlatformLayer, TestQueryService, TestSeedService } from '@budgie-at/test-kit';
import {
    AtmCashWithdrawalRepository,
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationRepairExecutorService,
    ExistingTransferRepository,
    IbanBridgeTransferRepository,
    ManualExpenseDuplicateRepository,
    P2pFiatDirectionEnum,
    P2pTransferTitleResolver,
    RefundConsolidationService,
    RefundPairRepository,
    TransferPairRepository,
    UnconsolidationService
} from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountRepository,
    Db,
    StatisticsRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testQueryService = new TestQueryService(testDb);

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(
    ConsolidationCoordinatorService.layer,
    ConsolidationExecutorService.layer,
    ConsolidationRepairExecutorService.layer,
    RefundConsolidationService.layer,
    UnconsolidationService.layer,
    AtmCashWithdrawalRepository.layer,
    ExistingTransferRepository.layer,
    IbanBridgeTransferRepository.layer,
    ManualExpenseDuplicateRepository.layer,
    RefundPairRepository.layer,
    TransferPairRepository.layer,
    AccountRepository.layer,
    AccountBalanceRepository.layer,
    AccountBalanceIncrementalService.layer,
    StatisticsRepository.layer,
    TransactionRepository.layer,
    TransactionEntryRepository.layer,
    TransactionTagsRepository.layer
).pipe(
    Layer.provideMerge(
        Layer.succeed(P2pTransferTitleResolver, (direction: P2pFiatDirectionEnum, assetCode: string): string =>
            direction === P2pFiatDirectionEnum.BUY ? `Binance P2P buy ${assetCode}` : `Binance P2P sell ${assetCode}`
        )
    ),
    Layer.provideMerge(makeTestPlatformLayer(testDb)),
    Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue()))
);

export const unconsolidateById = Effect.fn('unconsolidateById')(function* (transactionId: number) {
    const unconsolidationService = yield* UnconsolidationService;
    const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

    yield* Db.transaction(unconsolidationService.unconsolidateById(transactionId));
    yield* accountBalanceIncrementalService.updateAllBalances(false);
});
