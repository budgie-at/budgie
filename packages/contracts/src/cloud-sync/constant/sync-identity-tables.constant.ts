import type { SyncIdentityTableInterface } from '../interface/sync-identity-table.interface';

export const SYNC_IDENTITY_TABLES: readonly SyncIdentityTableInterface[] = [
    { name: 'accounts', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'bank_integrations', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'categories', keyExpression: 'CAST(id AS TEXT)', seedKeyExpression: `CASE WHEN is_default = 1 THEN 'category:' || id END` },
    { name: 'tags', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'rules', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'budgets', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'recurring_series', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'debt_events', keyExpression: 'CAST(id AS TEXT)' },
    {
        name: 'transactions',
        keyExpression: 'CAST(id AS TEXT)',
        bankColumnsExpression: `CASE WHEN external_source IS NOT NULL AND external_id IS NOT NULL AND external_id <> '' THEN external_source END AS bankSource,
            external_id AS bankTransactionExternalId,
            (SELECT a.external_id FROM transaction_entries e INNER JOIN accounts a ON a.id = e.account_id
                WHERE e.transaction_id = transactions.id AND a.external_id IS NOT NULL ORDER BY e.id LIMIT 1) AS bankAccountExternalId`
    },
    { name: 'transaction_entries', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'transaction_tags', keyExpression: `transaction_id || ':' || tag_id` },
    { name: 'transaction_receipts', keyExpression: 'CAST(transaction_id AS TEXT)' },
    { name: 'account_external_ids', keyExpression: 'external_id' },
    { name: 'budget_category_limits', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'budget_sinking_funds', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'budget_limit_changes', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'rule_conditions', keyExpression: 'CAST(id AS TEXT)' },
    { name: 'rule_actions', keyExpression: 'CAST(id AS TEXT)' }
];
