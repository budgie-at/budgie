import { TranslationLlmService, VoiceLlmService } from '@budgie/ai';
import {
    BudgetCategoryLimitRepository,
    BudgetPeriodCloseService,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    BudgetService
} from '@budgie/budget';
import {
    CategorizeInboxService,
    CommentEmbeddingRepository,
    EmbeddingIndexService,
    EmbeddingSuggestionService,
    MerchantEmbeddingRepository,
    TransactionCategorizeInboxRepository,
    TransactionEmbeddingRepository
} from '@budgie/categorization';
import { ConsolidationCoordinatorService, RefundConsolidationService } from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankIntegrationRepository,
    CategoryRepository,
    DebtEventRepository,
    InstallmentPlanRepository,
    InstrumentRepository,
    MccCategoryRepository,
    SettingsRepository,
    SyncRepository,
    TagRepository,
    MccGroupRepository,
    StatisticsRepository,
    TransactionEntryBaseValuationRepository,
    TransactionEntryPositionRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionReceiptRepository,
    TransactionViewRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { ExporterService, ImporterService } from '@budgie/import-export';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    AccountService,
    BalanceAdjustmentService,
    AccountTransferConversionService,
    CategoryService,
    ImportedBatchNormalizerService,
    ImportedTransactionEntryUpdateService,
    InstallmentPlanService,
    RefreshedImportedEntriesService,
    TransactionBatchCreateService,
    TransactionDebtSettlementService,
    TransactionDepositSafetyService,
    TransactionImportService,
    TransactionService,
    TransactionTransferService,
    TransferCreationService,
    LedgerWorkload,
    AccountDebtOpeningService,
    DebtAccountService,
    MoneyDataUpgradeService
} from '@budgie/ledger';
import {
    EntryBaseValuationService,
    ExchangeRateRepository,
    ExchangeRatesService,
    HistoricalExchangeRateRepository,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobRepository
} from '@budgie/market';
import { RecurringService } from '@budgie/recurring';
import { RuleEngineService, RuleMatcherService, RuleRepository, RuleService, TransactionRuleRepository } from '@budgie/rules';
import {
    AtmCashMoveService,
    BinanceSyncService,
    ErsteSyncService,
    ExternalAccountService,
    AccountReissueMergeService,
    MonobankSyncService,
    PrivatbankCategoryMatcherService,
    PrivatbankSyncService,
    ResyncService,
    SyncBalanceReconciliationService,
    SyncOperationMetadataService,
    SyncProviderRegistryService,
    SyncRepairService,
    TransferConsolidationService,
    UnpairedOwnCardTransferRepairService
} from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AiCoordinatorService } from '../../ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { AiModelDownloadService } from '../../ai/service/ai-model-download.service';
import { AiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { AiModelStorageService } from '../../ai/service/ai-model-storage.service';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AiTranslationStatusService } from '../../ai/service/ai-translation-status.service';
import { ChatService } from '../../ai/service/chat.service';
import { EmbeddingDrainerService } from '../../ai/service/embedding-drainer.service';
import { LocalEmbeddingService } from '../../ai/service/embedding.service';
import { SttService } from '../../ai/service/stt.service';
import { TranslationDrainerService } from '../../ai/service/translation-drainer.service';
import { VoiceReviewBatchCreateService } from '../../ai/service/voice-review-batch-create.service';
import { EmbeddingProgressStore } from '../../ai/store/embedding-progress.store';
import { TranslationProgressStore } from '../../ai/store/translation-progress.store';
import { AuthService } from '../../auth/service/auth.service';
import { PinAttemptService } from '../../auth/service/pin-attempt.service';
import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { DatabaseExportService } from '../../export/service/database-export.service';
import { DatabaseImportService } from '../../import/service/database-import.service';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { ReceiptScanService } from '../../receipt/service/receipt-scan.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { p2pTransferTitleResolverLayer } from '../../sync/layer/p2p-transfer-title-resolver.layer';
import { syncFileReaderLayer } from '../../sync/layer/sync-file-reader.layer';
import { syncWorkloadLayer } from '../../sync/layer/sync-workload.layer';
import { transferConsolidationDrainerLayer } from '../../sync/layer/transfer-consolidation-drainer.layer';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { BackgroundSyncSessionService } from '../../sync/service/background-sync-session.service';
import { TagService } from '../../tag/service/tag.service';
import { PatternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { RepeatedTransactionService } from '../../transaction/service/repeated-transaction.service';
import { WalletCaptureImportService } from '../../wallet-capture/service/wallet-capture-import.service';
import { WalletCaptureNativeService } from '../../wallet-capture/service/wallet-capture-native.service';
import { WalletCaptureTransactionService } from '../../wallet-capture/service/wallet-capture-transaction.service';
import { WidgetSnapshotBuilderService } from '../../widget/service/widget-snapshot-builder.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { DatabaseLifecycleService } from '../drizzle/service/database-lifecycle.service';
import { DatabaseMigrationService } from '../drizzle/service/database-migration.service';
import { DatabaseRekeyService } from '../drizzle/service/database-rekey.service';
import { AppResetService } from '../service/app-reset.service';
import { NetworkService } from '../service/network.service';
import { Workload } from '../service/workload.service';

const ledgerWorkloadLayer = Layer.effect(
    LedgerWorkload,
    Effect.map(Workload, workload => LedgerWorkload.of({ runForeground: workload.runForeground }))
).pipe(Layer.provide(Workload.layer));

const ledgerPortsLayer = Layer.mergeAll(ledgerWorkloadLayer, p2pTransferTitleResolverLayer);

export const appServicesWithoutDrainerLayer = Layer.mergeAll(
    AccountRepository.layer,
    AccountBalanceRepository.layer,
    DebtEventRepository.layer,
    InstallmentPlanRepository.layer,
    SettingsRepository.layer,
    BudgetRepository.layer,
    BudgetCategoryLimitRepository.layer,
    BudgetService.layer,
    BudgetPeriodSnapshotRepository.layer,
    BudgetPeriodCloseService.layer,
    RecurringService.layer,
    AccountBalanceIncrementalService.layer,
    AccountTransferConversionService.layer,
    AccountService.layer,
    BalanceAdjustmentService.layer,
    AccountArchiveService.layer,
    DebtAccountService.layer,
    AccountDebtOpeningService.layer,
    Workload.layer,
    DatabaseLifecycleService.layer,
    DatabaseMigrationService.layer,
    DatabaseRekeyService.layer,
    WidgetSnapshotBuilderService.layer,
    WidgetSnapshotService.layer,
    AppResetService.layer,
    DatabaseExportService.layer,
    DatabaseImportService.layer,
    ExporterService.layer,
    ImporterService.layer,
    TagRepository.layer,
    TagService.layer,
    CategoryRepository.layer,
    CategoryService.layer,
    MccCategoryRepository.layer,
    TransactionReceiptRepository.layer,
    CommentEmbeddingRepository.layer,
    MerchantEmbeddingRepository.layer,
    TransactionEmbeddingRepository.layer,
    RuleRepository.layer,
    TransactionRuleRepository.layer,
    RuleMatcherService.layer,
    RuleEngineService.layer,
    RuleService.layer,
    RuleApplicationDrainerService.layer,
    TransactionCategorizeInboxRepository.layer,
    CategorizeInboxService.layer,
    AtmCashMoveService.layer,
    ChatService.layer,
    LocalEmbeddingService.layer,
    NetworkService.layer,
    AiModelDownloadService.layer,
    SttService.layer,
    AiModelResidencyService.layer,
    TranslationProgressStore.layer,
    EmbeddingProgressStore.layer,
    TranslationDrainerService.layer,
    EmbeddingDrainerService.layer,
    AiCoordinatorService.layer,
    AiModelStorageService.layer,
    AiStorageReplacementService.layer,
    AiEmbeddingStatusService.layer,
    AiTranslationStatusService.layer,
    VoiceReviewBatchCreateService.layer,
    ReceiptScanService.layer,
    TranslationLlmService.layer.pipe(Layer.provide(ChatService.invokerLayer)),
    VoiceLlmService.layer.pipe(Layer.provide(ChatService.invokerLayer)),
    EmbeddingSuggestionService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
    EmbeddingIndexService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
    SyncRepository.layer,
    BankIntegrationRepository.layer,
    ExchangeRateRepository.layer,
    HistoricalExchangeRateRepository.layer,
    InstrumentRepository.layer,
    InstrumentMarketDataJobRepository.layer,
    InstrumentDailyMarketPriceRepository.layer,
    ConsolidationCoordinatorService.layer,
    ExchangeRatesService.layer,
    ExchangeRateBackgroundService.layer,
    HistoricalMarketDataDrainerService.layer,
    TransferConsolidationService.layer,
    UnpairedOwnCardTransferRepairService.layer,
    ExternalAccountService.layer,
    AccountReissueMergeService.layer,
    SyncRepairService.layer,
    SyncBalanceReconciliationService.layer,
    SyncOperationMetadataService.layer,
    PrivatbankCategoryMatcherService.layer,
    MonobankSyncService.layer,
    BinanceSyncService.layer,
    ErsteSyncService.layer,
    PrivatbankSyncService.layer,
    SyncProviderRegistryService.layer,
    ResyncService.layer,
    AppDataSyncService.layer,
    BackgroundSyncSessionService.layer,
    PinAttemptService.layer,
    AuthService.layer,
    BudgetAlertMonitorService.layer,
    OnboardingService.layer,
    TransactionRepository.layer,
    TransactionConsolidationRepository.layer,
    TransactionViewRepository.layer,
    TransactionEntryRepository.layer,
    TransactionEntryBaseValuationRepository.layer,
    TransactionEntryPositionRepository.layer,
    TransactionTagsRepository.layer,
    TransactionPatternRepository.layer,
    StatisticsRepository.layer,
    MccGroupRepository.layer,
    EntryBaseValuationService.layer,
    MoneyDataUpgradeService.layer,
    ImportedBatchNormalizerService.layer,
    ImportedTransactionEntryUpdateService.layer,
    PatternCacheService.layer,
    RefreshedImportedEntriesService.layer,
    RepeatedTransactionService.layer,
    TransactionBatchCreateService.layer,
    TransactionDebtSettlementService.layer,
    InstallmentPlanService.layer,
    TransactionDepositSafetyService.layer,
    TransactionImportService.layer,
    RefundConsolidationService.layer,
    TransactionTransferService.layer,
    TransferCreationService.layer,
    TransactionService.layer,
    WalletCaptureNativeService.layer,
    WalletCaptureTransactionService.layer,
    WalletCaptureImportService.layer
).pipe(Layer.provideMerge(Layer.mergeAll(syncWorkloadLayer, syncFileReaderLayer)), Layer.provide(ledgerPortsLayer));

export const appServicesLayer = appServicesWithoutDrainerLayer.pipe(
    Layer.provideMerge(transferConsolidationDrainerLayer.pipe(Layer.provide(ledgerPortsLayer)))
);
