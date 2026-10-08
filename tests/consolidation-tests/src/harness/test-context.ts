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
    StatisticsRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, LedgerWorkload, TransactionService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

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
    TransferConsolidationService.layer,
    TransactionService.layer,
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
    Layer.provideMerge(Layer.succeed(LedgerWorkload, LedgerWorkload.of({ runForeground: effect => effect }))),
    Layer.provideMerge(makeTestPlatformLayer(testDb)),
    Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue()))
);

export const rebuildStoredBalances = Effect.flatMap(AccountBalanceIncrementalService, accountBalanceIncrementalService =>
    accountBalanceIncrementalService.updateAllBalances(false)
);

export const seedStoredBalancesOnce = Effect.gen(function* () {
    const accountRepository = yield* AccountRepository;
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const accounts = yield* accountRepository.getAllActiveAccountsExceptBankAuthoritative();
    const storedBalances = yield* accountBalanceRepository.getByAccountIds(accounts.map(({ id }) => id));

    if (isEmptyArray(storedBalances)) {
        yield* rebuildStoredBalances;
    }
});

export const unconsolidateById = (transactionId: number) =>
    Effect.flatMap(TransactionService, transactionService => transactionService.unconsolidateById(transactionId));
