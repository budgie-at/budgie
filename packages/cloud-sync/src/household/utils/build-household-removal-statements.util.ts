import { HOUSEHOLD_SYNC_ZONE } from '@budgie/contracts';

const DELETION_ORDER = [
    'transactions',
    'debt_events',
    'recurring_series',
    'budgets',
    'rules',
    'accounts',
    'categories',
    'tags',
    'bank_integrations'
] as const;
const ZONE_STATE_TABLES = ['sync_record', 'sync_outbox', 'sync_pending'] as const;
const CATEGORY_DEPENDENT_TABLES = ['comment_embeddings', 'merchant_embeddings', 'default_category_translations'] as const;

export const buildHouseholdRemovalStatements = (databasePrefix: string): readonly string[] => {
    const zoneFilter = `sync_zone = '${HOUSEHOLD_SYNC_ZONE}'`;
    const householdIds = (tableName: string): string => `SELECT id FROM ${databasePrefix}${tableName} WHERE ${zoneFilter}`;

    return [
        `UPDATE ${databasePrefix}settings SET default_account_id = NULL WHERE default_account_id IN (${householdIds('accounts')})`,
        `DELETE FROM ${databasePrefix}account_balances WHERE account_id IN (${householdIds('accounts')})`,
        ...CATEGORY_DEPENDENT_TABLES.map(
            tableName => `DELETE FROM ${databasePrefix}${tableName} WHERE category_id IN (${householdIds('categories')})`
        ),
        ...DELETION_ORDER.map(tableName => `DELETE FROM ${databasePrefix}${tableName} WHERE ${zoneFilter}`),
        ...ZONE_STATE_TABLES.map(tableName => `DELETE FROM ${databasePrefix}${tableName} WHERE ${zoneFilter}`),
        `DELETE FROM ${databasePrefix}sync_zone_registry WHERE zone_label = '${HOUSEHOLD_SYNC_ZONE}'`
    ];
};
