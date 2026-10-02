import { TranslationLlmService, VoiceLlmService } from '@budgie/ai';
import {
    BudgetAlertThresholdService,
    BudgetCategoryLimitRepository,
    BudgetRepository,
    BudgetService,
    BudgetSpentService,
    BudgetTemplateService
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
import {
    AccountBalanceRepository,
    AccountRepository,
    BankIntegrationRepository,
    CategoryRepository,
    DebtEventRepository,
    InstrumentRepository,
    MccCategoryRepository,
    SettingsRepository,
    SyncRepository,
    TagRepository,
    MccGroupRepository,
    StatisticsRepository,
    TransactionEntryPositionRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionViewRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    AccountService,
    AccountTransferConversionService,
    CategoryService,
    ImportedBatchNormalizerService,
    ImportedTransactionEntryUpdateService,
    RefreshedImportedEntriesService,
    TransactionBatchCreateService,
    TransactionDebtSettlementService,
    TransactionDepositSafetyService,
    TransactionImportService,
    TransactionService,
    TransactionTransferService,
    TransferCreationService,
    LedgerWorkload
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
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AccountDebtOpeningService } from '../../account/service/account-debt-opening.service';
import { DebtAccountService } from '../../account/service/debt-account.service';
import { AiCoordinatorService } from '../../ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { AiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AiTranslationStatusService } from '../../ai/service/ai-translation-status.service';
import { ChatService } from '../../ai/service/chat.service';
import { EmbeddingDrainerService } from '../../ai/service/embedding-drainer.service';
import { LocalEmbeddingService } from '../../ai/service/embedding.service';
import { SttService } from '../../ai/service/stt.service';
import { TranslationDrainerService } from '../../ai/service/translation-drainer.service';
import { VoiceReviewBatchCreateService } from '../../ai/service/voice-review-batch-create.service';
import { WhisperModelService } from '../../ai/service/whisper-model.service';
import { EmbeddingProgressStore } from '../../ai/store/embedding-progress.store';
import { TranslationProgressStore } from '../../ai/store/translation-progress.store';
import { AuthService } from '../../auth/service/auth.service';
import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { CategorizeInboxCashService } from '../../categorize-inbox/service/categorize-inbox-cash.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { DatabaseExportService } from '../../export/service/database-export.service';
import { ExporterService } from '../../export/service/exporter.service';
import { DatabaseImportService } from '../../import/service/database-import.service';
import { ImporterService } from '../../import/service/importer.service';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { MoneyDataUpgradeService } from '../../money-data/service/money-data-upgrade.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { consolidationCoordinatorLayer } from '../../sync/layer/consolidation-coordinator.layer';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { BinanceAccountService } from '../../sync/service/binance-account.service';
import { BinanceAssetCodeService } from '../../sync/service/binance-asset-code.service';
import { BinanceSourceQuoteService } from '../../sync/service/binance-source-quote.service';
import { BinanceSyncService } from '../../sync/service/binance-sync.service';
import { BinanceTradeCursorService } from '../../sync/service/binance-trade-cursor.service';
import { ErsteSyncService } from '../../sync/service/erste-sync.service';
import { MonobankSyncService } from '../../sync/service/monobank-sync.service';
import { PrivatbankCategoryMatcherService } from '../../sync/service/privatbank-category-matcher.service';
import { PrivatbankSyncService } from '../../sync/service/privatbank-sync.service';
import { ResyncService } from '../../sync/service/resync.service';
import { SyncDuplicateSoftDeleteService } from '../../sync/service/sync-duplicate-soft-delete.service';
import { SyncIntegrationTokenService } from '../../sync/service/sync-integration-token.service';
import { SyncProviderRegistryService } from '../../sync/service/sync-provider-registry.service';
import { SyncRepairService } from '../../sync/service/sync-repair.service';
import { TransferConsolidationDrainerService } from '../../sync/service/transfer-consolidation-drainer.service';
import { TransferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { UnpairedOwnCardTransferRepairService } from '../../sync/service/unpaired-own-card-transfer-repair.service';
import { TagService } from '../../tag/service/tag.service';
import { PatternCacheService } from '../../transaction/service/pattern-cache/pattern-cache.service';
import { RepeatedTransactionService } from '../../transaction/service/repeated-transaction.service';
import { TransactionRefundService } from '../../transaction/service/transaction-refund.service';
import { WidgetSnapshotBuilderService } from '../../widget/service/widget-snapshot-builder.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { DatabaseLifecycleService } from '../drizzle/service/database-lifecycle.service';
import { DatabaseMigrationService } from '../drizzle/service/database-migration.service';
import { DatabaseRekeyService } from '../drizzle/service/database-rekey.service';
import { AppResetService } from '../service/app-reset.service';
import { Workload } from '../service/workload.service';

const ledgerWorkloadLayer = Layer.effect(
    LedgerWorkload,
    Effect.map(Workload, workload => LedgerWorkload.of({ runForeground: workload.runForeground }))
).pipe(Layer.provide(Workload.layer));

export const appServicesLayer = Layer.mergeAll(
    AccountRepository.layer,
    AccountBalanceRepository.layer,
    DebtEventRepository.layer,
    SettingsRepository.layer,
    BudgetRepository.layer,
    BudgetCategoryLimitRepository.layer,
    BudgetSpentService.layer,
    BudgetAlertThresholdService.layer,
    BudgetTemplateService.layer,
    BudgetService.layer,
    RecurringService.layer,
    AccountBalanceIncrementalService.layer,
    AccountTransferConversionService.layer,
    AccountService.layer,
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
    CategorizeInboxCashService.layer,
    ChatService.layer,
    LocalEmbeddingService.layer,
    WhisperModelService.layer,
    SttService.layer,
    AiModelResidencyService.layer,
    TranslationProgressStore.layer,
    EmbeddingProgressStore.layer,
    TranslationDrainerService.layer,
    EmbeddingDrainerService.layer,
    AiCoordinatorService.layer,
    AiStorageReplacementService.layer,
    AiEmbeddingStatusService.layer,
    AiTranslationStatusService.layer,
    VoiceReviewBatchCreateService.layer,
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
    consolidationCoordinatorLayer,
    ExchangeRatesService.layer,
    ExchangeRateBackgroundService.layer,
    HistoricalMarketDataDrainerService.layer,
    SyncIntegrationTokenService.layer,
    TransferConsolidationService.layer,
    TransferConsolidationDrainerService.layer,
    SyncDuplicateSoftDeleteService.layer,
    UnpairedOwnCardTransferRepairService.layer,
    SyncRepairService.layer,
    BinanceAssetCodeService.layer,
    BinanceSourceQuoteService.layer,
    BinanceTradeCursorService.layer,
    BinanceAccountService.layer,
    PrivatbankCategoryMatcherService.layer,
    MonobankSyncService.layer,
    BinanceSyncService.layer,
    ErsteSyncService.layer,
    PrivatbankSyncService.layer,
    SyncProviderRegistryService.layer,
    ResyncService.layer,
    AppDataSyncService.layer,
    AuthService.layer,
    BudgetAlertMonitorService.layer,
    OnboardingService.layer,
    TransactionRepository.layer,
    TransactionConsolidationRepository.layer,
    TransactionViewRepository.layer,
    TransactionEntryRepository.layer,
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
    TransactionDepositSafetyService.layer,
    TransactionImportService.layer,
    TransactionRefundService.layer,
    TransactionTransferService.layer,
    TransferCreationService.layer,
    TransactionService.layer
).pipe(Layer.provide(ledgerWorkloadLayer));
