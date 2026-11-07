import { HOUSEHOLD_SYNC_ZONE, TransactionTypeEnum } from '@budgie/contracts';

import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildHouseholdManualAccountTransferCandidatesSql = (scope: ConsolidationScanScopeInterface | null): string => `
    SELECT entry.transaction_id AS transactionId, target.id AS targetAccountId
    FROM transaction_entries entry
    INNER JOIN transactions source ON source.id = entry.transaction_id
    INNER JOIN accounts target ON target.iban = entry.to_iban
    WHERE entry.deleted_at IS NULL
        AND entry.original_transaction_id IS NULL
        AND entry.to_iban != ''
        AND source.deleted_at IS NULL
        AND source.consolidation_parent_transaction_id IS NULL
        AND source.consolidation_type IS NULL
        AND source.type IN ('${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}')
        AND target.deleted_at IS NULL
        AND target.is_active = 1
        AND target.sync_zone = '${HOUSEHOLD_SYNC_ZONE}'
        AND target.integration_id IS NULL
        AND (target.external_source IS NULL OR target.external_source = '')
        AND target.id != entry.account_id
        AND NOT EXISTS (
            SELECT 1 FROM accounts rival
            WHERE rival.iban = entry.to_iban AND rival.deleted_at IS NULL AND rival.is_active = 1 AND rival.id != target.id
        )
        ${buildConsolidationScanScopeSql(scope, 'source.operated_at')}
`;
