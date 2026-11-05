import type { SyncIdentityTableInterface } from '../interface/sync-identity-table.interface';

const createdAtKey = "id || ':' || created_at";
const parentCreatedAt = (parentTable: string, foreignKey: string, tableName: string) =>
    `COALESCE((SELECT created_at FROM ${parentTable} WHERE ${parentTable}.id = ${tableName}.${foreignKey}), '')`;

export const SYNC_IDENTITY_TABLES: readonly SyncIdentityTableInterface[] = [
    { name: 'accounts', keyExpression: createdAtKey },
    { name: 'bank_integrations', keyExpression: createdAtKey },
    { name: 'categories', keyExpression: createdAtKey, seedKeyExpression: `CASE WHEN is_default = 1 THEN 'category:' || id END` },
    { name: 'tags', keyExpression: createdAtKey },
    { name: 'rules', keyExpression: createdAtKey },
    { name: 'budgets', keyExpression: createdAtKey },
    { name: 'recurring_series', keyExpression: createdAtKey },
    { name: 'debt_events', keyExpression: createdAtKey },
    {
        name: 'transactions',
        keyExpression: createdAtKey,
        bankColumnsExpression: `CASE WHEN external_source IS NOT NULL AND external_id IS NOT NULL AND external_id <> '' THEN external_source END AS bankSource,
            external_id AS bankTransactionExternalId,
            (SELECT a.external_id FROM transaction_entries e INNER JOIN accounts a ON a.id = e.account_id
                WHERE e.transaction_id = transactions.id AND a.external_id IS NOT NULL ORDER BY e.id LIMIT 1) AS bankAccountExternalId`
    },
    { name: 'transaction_entries', keyExpression: createdAtKey },
    {
        name: 'transaction_tags',
        keyExpression: `transaction_id || ':' || ${parentCreatedAt('transactions', 'transaction_id', 'transaction_tags')} || ':' || tag_id || ':' || ${parentCreatedAt('tags', 'tag_id', 'transaction_tags')}`
    },
    {
        name: 'transaction_receipts',
        keyExpression: `transaction_id || ':' || ${parentCreatedAt('transactions', 'transaction_id', 'transaction_receipts')} || ':' || fingerprint`
    },
    {
        name: 'account_external_ids',
        keyExpression: `external_id || ':' || ${parentCreatedAt('accounts', 'account_id', 'account_external_ids')}`
    },
    { name: 'budget_category_limits', keyExpression: createdAtKey },
    { name: 'budget_sinking_funds', keyExpression: createdAtKey },
    { name: 'budget_limit_changes', keyExpression: createdAtKey },
    { name: 'rule_conditions', keyExpression: createdAtKey },
    { name: 'rule_actions', keyExpression: createdAtKey }
];
