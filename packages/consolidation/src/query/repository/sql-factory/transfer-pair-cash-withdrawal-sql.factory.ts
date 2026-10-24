import {
    ATM_CASH_WITHDRAWAL_MCC,
    ATM_CASH_WITHDRAWAL_TITLE_PREFIXES,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { buildPrefixLikeSql } from '../../../shared/utils/build-prefix-like-sql.util';
import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const ERSTE_ATM_WITHDRAWAL_TITLE_GLOB = 'AUTOMAT [0-9]* K[0-9]* *';
const ERSTE_ATM_TERMINAL_TOKENS_SQL = `substr(expense_tx.title, 9)`;
const ERSTE_ATM_CARD_TOKENS_SQL = `substr(${ERSTE_ATM_TERMINAL_TOKENS_SQL}, instr(${ERSTE_ATM_TERMINAL_TOKENS_SQL}, ' ') + 2)`;

const ATM_TITLE_PREFIX_SQL = buildPrefixLikeSql(`(expense_tx.title || ' ')`, [
    ...new Set(
        Object.values(ATM_CASH_WITHDRAWAL_TITLE_PREFIXES)
            .flat()
            .flatMap(prefix => [prefix, prefix.toLocaleUpperCase(), `${prefix.charAt(0).toLocaleUpperCase()}${prefix.slice(1)}`])
            .map(prefix => `${prefix} `)
    )
]);

const buildFirstTokenSql = (tokensSql: string): string => `substr(${tokensSql}, 1, instr(${tokensSql}, ' ') - 1)`;

const buildCandidatesSql = (scope: ConsolidationScanScopeInterface | null, conditionSql: string): string => `
            WITH active_cash_accounts AS (
                SELECT
                    cash_account.id,
                    cash_account.title,
                    cash_account.instrument_id,
                    cash_account.created_at
                FROM accounts cash_account
                WHERE cash_account.deleted_at IS NULL
                    AND cash_account.is_active = 1
                    AND cash_account.type = 'CASH'
            ),
            cash_account_counts AS (
                SELECT
                    instrument_id,
                    COUNT(*) as cashAccountCount
                FROM active_cash_accounts
                GROUP BY instrument_id
            )
            SELECT
                'AUTO_ATM_CASH_WITHDRAWAL' as confidenceBucket,
                expense_tx.id as transactionId,
                expense_tx.title as transactionTitle,
                expense_tx.operated_at as operatedAt,
                expense_entry.id as entryId,
                source_account.id as sourceAccountId,
                target_cash_account.id as targetCashAccountId,
                source_instrument.code as currency,
                expense_entry.amount as amount
            FROM transaction_entries expense_entry
            INNER JOIN transactions expense_tx ON
                expense_entry.transaction_id = expense_tx.id
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
            INNER JOIN accounts source_account ON
                source_account.id = expense_entry.account_id
                AND source_account.deleted_at IS NULL
                AND source_account.type != 'CASH'
            INNER JOIN instruments source_instrument ON source_instrument.id = source_account.instrument_id
            LEFT JOIN mcc_categories expense_mcc ON expense_mcc.id = expense_entry.mcc_category_id
            INNER JOIN cash_account_counts ON
                cash_account_counts.instrument_id = source_account.instrument_id
                AND cash_account_counts.cashAccountCount = 1
            INNER JOIN active_cash_accounts target_cash_account ON
                target_cash_account.instrument_id = source_account.instrument_id
            WHERE expense_entry.deleted_at IS NULL
                AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                AND expense_entry.original_transaction_id IS NULL
                AND (
                    expense_entry.category_id IS NULL
                    OR expense_entry.category_source IN ('${CategorySourceEnum.AI}', '${CategorySourceEnum.MCC_DEFAULT}')
                )
                AND (
                    expense_mcc.mcc = '${ATM_CASH_WITHDRAWAL_MCC}'
                    OR (
                        expense_entry.mcc_category_id IS NULL
                        AND ${ATM_TITLE_PREFIX_SQL}
                    )
                    OR (
                        expense_entry.mcc_category_id IS NULL
                        AND expense_tx.external_source = '${ExternalSourceEnum.ERSTE}'
                        AND expense_tx.title GLOB '${ERSTE_ATM_WITHDRAWAL_TITLE_GLOB}'
                        AND ${buildFirstTokenSql(ERSTE_ATM_TERMINAL_TOKENS_SQL)} NOT GLOB '*[^0-9]*'
                        AND ${buildFirstTokenSql(ERSTE_ATM_CARD_TOKENS_SQL)} NOT GLOB '*[^0-9]*'
                    )
                )
                ${conditionSql}
                ${buildConsolidationScanScopeSql(scope, 'expense_tx.operated_at')}
        `;

export const buildAtmCashWithdrawalCandidatesSql = (scope: ConsolidationScanScopeInterface | null): string => buildCandidatesSql(scope, '');

export const buildAutoAtmCashWithdrawalCandidatesSql = (scope: ConsolidationScanScopeInterface | null): string =>
    buildCandidatesSql(scope, 'AND expense_tx.operated_at >= target_cash_account.created_at');
