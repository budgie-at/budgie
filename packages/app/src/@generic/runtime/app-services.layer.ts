// eslint-disable max-lines -- approved by liaugust: appServicesLayer is the single registration point
import { VoiceLlmService } from '@budgie/ai';
import {
    BudgetCategoryLimitRepository,
    BudgetFundSpendService,
    BudgetLimitChangeRepository,
    BudgetPeriodCloseService,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    BudgetService,
    BudgetSinkingFundRepository
} from '@budgie/budget';
import {
    CategorizeInboxService,
    EmbeddingIndexService,
    EmbeddingSuggestionService,
    TransactionCategorizeInboxRepository,
    TransactionEmbeddingRepository
} from '@budgie/categorization';
import { HouseholdShareService, SyncOutboxRepository } from '@budgie/cloud-sync';
import { ConsolidationCoordinatorService, RefundConsolidationService } from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankIntegrationRepository,
    CategoryRepository,
    DebtEventRepository,
    InstallmentPlanRepository,
    InstrumentRepository,
    InvestmentReturnRepository,
    MccCategoryRepository,
    SettingsRepository,
    SyncRepository,
    TagRepository,
    StatisticsRepository,
    TransactionEntryBaseValuationRepository,
    TransactionEntryPositionRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionYieldRepository,
    TransactionConsolidationRepository,
    TransactionReceiptRepository,
    TransactionDayNetAmountRepository,
    TransactionViewRepository,
    TransactionTagsRepository,
    SyncIdentityRepository,
    SyncRecordRepository,
    SyncZoneRegistryRepository
} from '@budgie/contracts';
import { ExporterService, ImporterService } from '@budgie/import-export';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    AccountDebtOpeningService,
    AccountService,
    BalanceAdjustmentService,
    CategoryService,
    DebtAccountService,
    DepositInterestService,
    InstallmentPlanService,
    LedgerWorkload,
    MoneyDataUpgradeService,
    ReceiptMatchService,
    RefreshedImportedEntriesService,
    TransactionDebtSettlementService,
    TransactionImportService,
    TransactionService,
    TransactionTransferService,
    TransferConsolidationService,
    TransferCreationService
} from '@budgie/ledger';
import {
    EntryBaseValuationService,
    ExchangeRateRepository,
    ExchangeRatesService,
    HistoricalExchangeRateRepository,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobRepository
} from '@budgie/market';
import { RecurringRefreshService, RecurringService } from '@budgie/recurring';
import { RuleEngineService, RuleMatcherService, RuleRepository, RuleService, TransactionRuleRepository } from '@budgie/rules';
import {
    AtmCashMoveService,
    BinanceSyncService,
    ErsteSyncService,
    ExternalAccountService,
    AccountReissueMergeService,
    InzhurGainService,
    InzhurManualPurchaseService,
    InzhurOperationsImportService,
    InzhurSetupService,
    MonobankSyncService,
    PrivatbankCategoryMatcherService,
    PrivatbankSyncService,
    ResyncService,
    SyncOperationMetadataService,
    SyncProviderRegistryService,
    SyncRepairService,
    YieldTagRepairService,
    transferConsolidationBankFlowLayer,
    OwnTransferRepairService,
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
import { BudgetFundSuggestionService } from '../../budget/service/budget-fund-suggestion.service';
import { BudgetProjectionService } from '../../budget/service/budget-projection.service';
import { CategoryIconBackfillService } from '../../category/service/category-icon-backfill.service';
import { cloudBackupLayer } from '../../cloud-backup/layer/cloud-backup.layer';
import { InstallIdService } from '../../cloud-backup/service/install-id.service';
import { cloudSyncLayer } from '../../cloud-sync/layer/cloud-sync.layer';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { DatabaseExportService } from '../../export/service/database-export.service';
import { DatabaseImportService } from '../../import/service/database-import.service';
import { InzhurPendingTopUpService } from '../../inzhur/service/inzhur-pending-top-up.service';
import { InzhurStatementReminderService } from '../../inzhur/service/inzhur-statement-reminder.service';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { ReceiptScanService } from '../../receipt/service/receipt-scan.service';
import { RecurringReminderService } from '../../recurring/service/recurring-reminder.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { p2pTransferTitleResolverLayer } from '../../sync/layer/p2p-transfer-title-resolver.layer';
import { syncFileReaderLayer } from '../../sync/layer/sync-file-reader.layer';
import { syncWorkloadLayer } from '../../sync/layer/sync-workload.layer';
import { transferConsolidationDrainerLayer } from '../../sync/layer/transfer-consolidation-drainer.layer';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { BackgroundSyncSessionService } from '../../sync/service/background-sync-session.service';
import { EnableBankingConnectionService } from '../../sync/service/enable-banking-connection.service';
import { TagService } from '../../tag/service/tag.service';
import { RepeatedTransactionService } from '../../transaction/service/repeated-transaction.service';
import { WalletCaptureImportService } from '../../wallet-capture/service/wallet-capture-import.service';
import { WalletCaptureNativeService } from '../../wallet-capture/service/wallet-capture-native.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { DatabaseLifecycleService } from '../drizzle/service/database-lifecycle.service';
import { DatabaseMaintenanceService } from '../drizzle/service/database-maintenance.service';
import { DatabaseMigrationService } from '../drizzle/service/database-migration.service';
import { DatabaseRekeyService } from '../drizzle/service/database-rekey.service';
import { AppResetService } from '../service/app-reset.service';
import { NetworkService } from '../service/network.service';
import { Workload } from '../service/workload.service';
const ledgerWorkloadLayer = Layer.effect(
    LedgerWorkload,
    Effect.map(Workload, workload => LedgerWorkload.of({ runForeground: workload.runForeground }))
).pipe(Layer.provide(Workload.layer));
const ledgerPortsLayer = transferConsolidationBankFlowLayer.pipe(
    Layer.provideMerge(Layer.mergeAll(ledgerWorkloadLayer, p2pTransferTitleResolverLayer))
);
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
    BudgetSinkingFundRepository.layer,
    BudgetLimitChangeRepository.layer,
    BudgetFundSpendService.layer,
    Layer.mergeAll(RecurringService.layer, RecurringRefreshService.layer, RecurringReminderService.layer),
    AccountBalanceIncrementalService.layer,
    AccountService.layer,
    BalanceAdjustmentService.layer,
    AccountArchiveService.layer,
    DebtAccountService.layer,
    AccountDebtOpeningService.layer,
    Workload.layer,
    DatabaseLifecycleService.layer,
    DatabaseMigrationService.layer,
    DatabaseMaintenanceService.layer,
    DatabaseRekeyService.layer,
    SiriCatalogService.layer,
    WidgetSnapshotService.layer,
    InzhurStatementReminderService.layer,
    InzhurPendingTopUpService.layer,
    AppResetService.layer,
    DatabaseExportService.layer,
    DatabaseImportService.layer,
    ExporterService.layer,
    ImporterService.layer,
    TagRepository.layer,
    TagService.layer,
    SyncIdentityRepository.layer,
    SyncOutboxRepository.layer,
    HouseholdShareService.layer,
    SyncRecordRepository.layer,
    SyncZoneRegistryRepository.layer,
    CategoryRepository.layer,
    CategoryService.layer,
    CategoryIconBackfillService.layer,
    MccCategoryRepository.layer,
    TransactionReceiptRepository.layer,
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
    ReceiptMatchService.layer,
    ReceiptScanService.layer,
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
    YieldTagRepairService.layer,
    OwnTransferRepairService.layer,
    SyncOperationMetadataService.layer,
    PrivatbankCategoryMatcherService.layer,
    MonobankSyncService.layer,
    BinanceSyncService.layer,
    EnableBankingConnectionService.layer,
    ErsteSyncService.layer,
    PrivatbankSyncService.layer,
    SyncProviderRegistryService.layer,
    InzhurSetupService.layer,
    InzhurOperationsImportService.layer,
    InzhurManualPurchaseService.layer,
    InzhurGainService.layer,
    InvestmentReturnRepository.layer,
    ResyncService.layer,
    AppDataSyncService.layer,
    BackgroundSyncSessionService.layer,
    PinAttemptService.layer,
    AuthService.layer,
    BudgetAlertMonitorService.layer,
    BudgetProjectionService.layer,
    BudgetFundSuggestionService.layer,
    OnboardingService.layer,
    TransactionRepository.layer,
    TransactionYieldRepository.layer,
    TransactionConsolidationRepository.layer,
    TransactionViewRepository.layer,
    TransactionDayNetAmountRepository.layer,
    TransactionEntryRepository.layer,
    TransactionEntryBaseValuationRepository.layer,
    TransactionEntryPositionRepository.layer,
    TransactionTagsRepository.layer,
    StatisticsRepository.layer,
    EntryBaseValuationService.layer,
    MoneyDataUpgradeService.layer,
    RefreshedImportedEntriesService.layer,
    RepeatedTransactionService.layer,
    TransactionDebtSettlementService.layer,
    InstallmentPlanService.layer,
    TransactionImportService.layer,
    RefundConsolidationService.layer,
    TransactionTransferService.layer,
    DepositInterestService.layer,
    TransferCreationService.layer,
    TransactionService.layer,
    WalletCaptureNativeService.layer,
    WalletCaptureImportService.layer,
    InstallIdService.layer,
    cloudBackupLayer,
    cloudSyncLayer
).pipe(Layer.provideMerge(Layer.mergeAll(syncWorkloadLayer, syncFileReaderLayer)), Layer.provide(ledgerPortsLayer));
export const appServicesLayer = appServicesWithoutDrainerLayer.pipe(
    Layer.provideMerge(transferConsolidationDrainerLayer.pipe(Layer.provide(ledgerPortsLayer)))
);
