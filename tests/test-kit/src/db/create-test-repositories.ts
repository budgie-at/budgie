import * as contracts from '@budgie/contracts';
import { RefundPairRepository, TransferPairRepository } from '@budgie/consolidation';

import type { DB } from '@budgie/contracts';

export const createTestRepositories = (db: DB) => ({
    tagRepository: new contracts.TagRepository(db),
    accountRepository: new contracts.AccountRepository(db),
    settingsRepository: new contracts.SettingsRepository(db),
    categoryRepository: new contracts.CategoryRepository(db),
    instrumentRepository: new contracts.InstrumentRepository(db),
    exchangeRateRepository: new contracts.ExchangeRateRepository(db),
    historicalExchangeRateRepository: new contracts.HistoricalExchangeRateRepository(db),
    accountBalanceRepository: new contracts.AccountBalanceRepository(db),
    bankSyncRepository: new contracts.BankSyncRepository(db),
    ruleRepository: new contracts.RuleRepository(db),
    ruleActionRepository: new contracts.RuleActionRepository(db),
    ruleConditionRepository: new contracts.RuleConditionRepository(db),
    mccCategoryRepository: new contracts.MccCategoryRepository(db),
    statisticsRepository: new contracts.StatisticsRepository(db),
    transactionEmbeddingRepository: new contracts.TransactionEmbeddingRepository(db),
    transactionEntryRepository: new contracts.TransactionEntryRepository(db),
    transactionPatternRepository: new contracts.TransactionPatternRepository(db),
    transactionRepository: new contracts.TransactionRepository(db),
    transactionRuleRepository: new contracts.TransactionRuleRepository(db),
    transactionTagsRepository: new contracts.TransactionTagsRepository(db),
    merchantEmbeddingRepository: new contracts.MerchantEmbeddingRepository(db),
    commentEmbeddingRepository: new contracts.CommentEmbeddingRepository(db),
    transferPairRepository: new TransferPairRepository(db),
    refundPairRepository: new RefundPairRepository(db)
});
