import { AccountEntityTable } from '../../../account/table/account-entity.table';
import { AccountExternalIdEntityTable } from '../../../account/table/account-external-id-entity.table';
import { BankIntegrationEntityTable } from '../../../bank-integration/table/bank-integration-entity.table';
import { BudgetCategoryLimitEntityTable } from '../../../budget-category-limit/table/budget-category-limit-entity.table';
import { BudgetLimitChangeEntityTable } from '../../../budget-limit-change/table/budget-limit-change-entity.table';
import { BudgetSinkingFundEntityTable } from '../../../budget-sinking-fund/table/budget-sinking-fund-entity.table';
import { BudgetEntityTable } from '../../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../../category/table/category-entity.table';
import { DebtEventEntityTable } from '../../../debt-event/table/debt-event-entity.table';
import { RecurringSeriesEntityTable } from '../../../recurring-series/table/recurring-series-entity.table';
import { RuleActionEntityTable } from '../../../rule-action/table/rule-action-entity.table';
import { RuleConditionEntityTable } from '../../../rule-condition/table/rule-condition-entity.table';
import { RuleEntityTable } from '../../../rule/table/rule-entity.table';
import { TagEntityTable } from '../../../tag/table/tag-entity.table';
import { TransactionEntryEntityTable } from '../../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionReceiptEntityTable } from '../../../transaction-receipt/table/transaction-receipt-entity.table';
import { TransactionTagsEntityTable } from '../../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionEntityTable } from '../../../transaction/table/transaction-entity.table';
import { SyncLinkRoleEnum } from '../enum/sync-link-role.enum';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import { buildSyncTableDescriptor } from '../utils/build-sync-table-descriptor.util';

import type { SyncRecordDefinitionInterface } from '../interface/sync-record-definition.interface';

const TRANSACTION_LEG_OMITTED_ENTRY_PROPERTIES = ['toIban'];
const TRANSACTION_LEG_PARENT_PROPERTIES = ['type', 'operatedAt', 'createdAt', 'updatedAt', 'deletedAt', 'fromAccountId', 'toAccountId'];

export const SYNC_RECORD_DEFINITIONS: Readonly<Record<SyncRecordTypeEnum, SyncRecordDefinitionInterface>> = {
    [SyncRecordTypeEnum.ACCOUNT]: {
        recordType: SyncRecordTypeEnum.ACCOUNT,
        parent: buildSyncTableDescriptor(AccountEntityTable),
        children: [
            { field: 'externalIds', descriptor: buildSyncTableDescriptor(AccountExternalIdEntityTable, { parentProperty: 'accountId' }) }
        ],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.BANK_INTEGRATION]: {
        recordType: SyncRecordTypeEnum.BANK_INTEGRATION,
        parent: buildSyncTableDescriptor(BankIntegrationEntityTable),
        children: [],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.BUDGET]: {
        recordType: SyncRecordTypeEnum.BUDGET,
        parent: buildSyncTableDescriptor(BudgetEntityTable),
        children: [
            {
                field: 'categoryLimits',
                descriptor: buildSyncTableDescriptor(BudgetCategoryLimitEntityTable, { parentProperty: 'budgetId' })
            },
            { field: 'sinkingFunds', descriptor: buildSyncTableDescriptor(BudgetSinkingFundEntityTable, { parentProperty: 'budgetId' }) },
            { field: 'limitChanges', descriptor: buildSyncTableDescriptor(BudgetLimitChangeEntityTable, { parentProperty: 'budgetId' }) }
        ],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.CATEGORY]: {
        recordType: SyncRecordTypeEnum.CATEGORY,
        parent: buildSyncTableDescriptor(CategoryEntityTable),
        children: [],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.DEBT_EVENT]: {
        recordType: SyncRecordTypeEnum.DEBT_EVENT,
        parent: buildSyncTableDescriptor(DebtEventEntityTable),
        children: [],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.RECURRING_SERIES]: {
        recordType: SyncRecordTypeEnum.RECURRING_SERIES,
        parent: buildSyncTableDescriptor(RecurringSeriesEntityTable),
        children: [],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.RULE]: {
        recordType: SyncRecordTypeEnum.RULE,
        parent: buildSyncTableDescriptor(RuleEntityTable),
        children: [
            { field: 'conditions', descriptor: buildSyncTableDescriptor(RuleConditionEntityTable, { parentProperty: 'ruleId' }) },
            { field: 'actions', descriptor: buildSyncTableDescriptor(RuleActionEntityTable, { parentProperty: 'ruleId' }) }
        ],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.TAG]: {
        recordType: SyncRecordTypeEnum.TAG,
        parent: buildSyncTableDescriptor(TagEntityTable),
        children: [],
        linkRole: null,
        legPrivateEntries: null,
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.TRANSACTION]: {
        recordType: SyncRecordTypeEnum.TRANSACTION,
        parent: buildSyncTableDescriptor(TransactionEntityTable),
        children: [
            { field: 'entries', descriptor: buildSyncTableDescriptor(TransactionEntryEntityTable, { parentProperty: 'transactionId' }) },
            { field: 'tags', descriptor: buildSyncTableDescriptor(TransactionTagsEntityTable, { parentProperty: 'transactionId' }) },
            { field: 'receipts', descriptor: buildSyncTableDescriptor(TransactionReceiptEntityTable, { parentProperty: 'transactionId' }) }
        ],
        linkRole: SyncLinkRoleEnum.HOME,
        legPrivateEntries: {
            field: 'legEntryPrivate',
            descriptor: buildSyncTableDescriptor(TransactionEntryEntityTable, {
                parentProperty: 'transactionId',
                includeOnly: [...TRANSACTION_LEG_OMITTED_ENTRY_PROPERTIES, 'syncId']
            })
        },
        parentDefaults: {}
    },
    [SyncRecordTypeEnum.TRANSACTION_LEG]: {
        recordType: SyncRecordTypeEnum.TRANSACTION_LEG,
        parent: buildSyncTableDescriptor(TransactionEntityTable, { includeOnly: TRANSACTION_LEG_PARENT_PROPERTIES }),
        children: [
            {
                field: 'entries',
                descriptor: buildSyncTableDescriptor(TransactionEntryEntityTable, {
                    parentProperty: 'transactionId',
                    omit: TRANSACTION_LEG_OMITTED_ENTRY_PROPERTIES
                })
            }
        ],
        linkRole: SyncLinkRoleEnum.LEG,
        legPrivateEntries: null,
        parentDefaults: { title: '', exchangeRate: 1 }
    }
};
