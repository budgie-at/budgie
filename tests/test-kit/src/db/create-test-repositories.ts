import {
    AtmCashWithdrawalRepository,
    ExistingTransferRepository,
    IbanBridgeTransferRepository,
    RefundPairRepository,
    TransferPairRepository
} from '@budgie/consolidation';
import * as contracts from '@budgie/contracts';

import type { DB } from '@budgie/contracts';

export const createTestRepositories = (db: DB) => ({
    tagRepository: new contracts.TagRepository(db),
    accountRepository: new contracts.AccountRepository(db),
    settingsRepository: new contracts.SettingsRepository(db),
    categoryRepository: new contracts.CategoryRepository(db),
    instrumentRepository: new contracts.InstrumentRepository(db),
    exchangeRateRepository: new contracts.ExchangeRateRepository(db),
    historicalExchangeRateRepository: new contracts.HistoricalExchangeRateRepository(),
    instrumentDailyMarketPriceRepository: new contracts.InstrumentDailyMarketPriceRepository(db),
    instrumentMarketDataJobRepository: new contracts.InstrumentMarketDataJobRepository(db),
    accountBalanceRepository: new contracts.AccountBalanceRepository(db),
    syncRepository: new contracts.SyncRepository(db),
    debtEventRepository: new contracts.DebtEventRepository(db),
    bankIntegrationRepository: new contracts.BankIntegrationRepository(db),
    ruleRepository: new contracts.RuleRepository(db),
    ruleActionRepository: new contracts.RuleActionRepository(db),
    ruleConditionRepository: new contracts.RuleConditionRepository(db),
    mccCategoryRepository: new contracts.MccCategoryRepository(db),
    statisticsRepository: new contracts.StatisticsRepository(db),
    transactionEmbeddingRepository: new contracts.TransactionEmbeddingRepository(),
    transactionEntryRepository: new contracts.TransactionEntryRepository(),
    transactionPatternRepository: new contracts.TransactionPatternRepository(db),
    transactionRepository: new contracts.TransactionRepository(db),
    transactionCategorizeInboxRepository: new contracts.TransactionCategorizeInboxRepository(db),
    transactionRuleRepository: new contracts.TransactionRuleRepository(db),
    transactionTagsRepository: new contracts.TransactionTagsRepository(),
    merchantEmbeddingRepository: new contracts.MerchantEmbeddingRepository(),
    commentEmbeddingRepository: new contracts.CommentEmbeddingRepository(),
    transferPairRepository: new TransferPairRepository(),
    atmCashWithdrawalRepository: new AtmCashWithdrawalRepository(),
    existingTransferRepository: new ExistingTransferRepository(),
    ibanBridgeTransferRepository: new IbanBridgeTransferRepository(),
    refundPairRepository: new RefundPairRepository()
});
