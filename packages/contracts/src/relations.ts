import { defineRelations } from 'drizzle-orm';

import { AccountBalanceEntityRelations } from './account-balance/relations/account-balance-entity.relations';
import { AccountEntityRelations } from './account/relations/account-entity.relations';
import { BankIntegrationEntityRelations } from './bank-integration/relations/bank-integration-entity.relations';
import { BudgetCategoryLimitEntityRelations } from './budget-category-limit/relations/budget-category-limit-entity.relations';
import { BudgetEntityRelations } from './budget/relations/budget-entity.relations';
import { DefaultCategoryTranslationEntityRelations } from './category-translation/relations/default-category-translation-entity.relations';
import { CategoryEntityRelations } from './category/relations/category-entity.relations';
import { CommentEmbeddingEntityRelations } from './comment-embedding/relations/comment-embedding-entity.relations';
import { CommentEmbeddingTagEntityRelations } from './comment-embedding/relations/comment-embedding-tag-entity.relations';
import { DebtEventEntityRelations } from './debt-event/relations/debt-event-entity.relations';
import { ExchangeRateEntityRelations } from './exchange-rate/relations/exchange-rate-entity.relations';
import { MccCategoryEntityRelations } from './mcc-category/relations/mcc-category-entity.relations';
import { MccGroupEntityRelations } from './mcc-group/relations/mcc-group-entity.relations';
import { MerchantEmbeddingEntityRelations } from './merchant-embedding/relations/merchant-embedding-entity.relations';
import { MerchantEmbeddingTagEntityRelations } from './merchant-embedding/relations/merchant-embedding-tag-entity.relations';
import { RuleActionEntityRelations } from './rule-action/relations/rule-action-entity.relations';
import { RuleConditionEntityRelations } from './rule-condition/relations/rule-condition-entity.relations';
import { RuleEntityRelations } from './rule/relations/rule-entity.relations';
import * as schema from './schema';
import { SettingsEntityRelations } from './settings/relations/settings-entity.relations';
import { SyncEntityRelations } from './sync/relations/sync-entity.relations';
import { TagEntityRelations } from './tag/relations/tag-entity.relations';
import { TransactionEntryEntityRelations } from './transaction-entry/relations/transaction-entry-entity.relations';
import { TransactionTagsEntityRelations } from './transaction-tags/relations/transaction-tags-entity.relations';
import { TransactionEntityRelations } from './transaction/relations/transaction-entity.relations';

export const relations = {
    ...defineRelations(schema),
    ...AccountEntityRelations,
    ...AccountBalanceEntityRelations,
    ...DebtEventEntityRelations,
    ...BankIntegrationEntityRelations,
    ...SyncEntityRelations,
    ...TagEntityRelations,
    ...CategoryEntityRelations,
    ...DefaultCategoryTranslationEntityRelations,
    ...MccGroupEntityRelations,
    ...MccCategoryEntityRelations,
    ...TransactionEntityRelations,
    ...TransactionTagsEntityRelations,
    ...TransactionEntryEntityRelations,
    ...ExchangeRateEntityRelations,
    ...SettingsEntityRelations,
    ...MerchantEmbeddingEntityRelations,
    ...MerchantEmbeddingTagEntityRelations,
    ...CommentEmbeddingEntityRelations,
    ...CommentEmbeddingTagEntityRelations,
    ...RuleEntityRelations,
    ...RuleConditionEntityRelations,
    ...RuleActionEntityRelations,
    ...BudgetEntityRelations,
    ...BudgetCategoryLimitEntityRelations
};
