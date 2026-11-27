import { REFUND_TIME_WINDOW_SECONDS, REFUND_TITLE_PREFIXES, TransactionTypeEnum } from '@budgie/contracts';

import { buildPrefixLikeSql } from '../../shared/utils/build-prefix-like-sql.util';

export const buildNotRejectedPaymentRefundSql = (accountIdColumn: string, amountColumn: string, operatedAtColumn: string): string => `
    NOT EXISTS (
        SELECT 1
        FROM transactions rejected_payment_refund_tx INDEXED BY transactions_visible_type_to_operated_idx
        INNER JOIN transaction_entries rejected_payment_refund_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
            rejected_payment_refund_entry.transaction_id = rejected_payment_refund_tx.id
            AND rejected_payment_refund_entry.deleted_at IS NULL
            AND rejected_payment_refund_entry.original_transaction_id IS NULL
            AND rejected_payment_refund_entry.account_id = ${accountIdColumn}
            AND rejected_payment_refund_entry.amount = ${amountColumn}
        WHERE rejected_payment_refund_tx.type = '${TransactionTypeEnum.INCOME}'
            AND rejected_payment_refund_tx.deleted_at IS NULL
            AND rejected_payment_refund_tx.consolidation_parent_transaction_id IS NULL
            AND rejected_payment_refund_tx.to_account_id IS NOT NULL
            AND rejected_payment_refund_tx.to_account_id = ${accountIdColumn}
            AND rejected_payment_refund_tx.operated_at BETWEEN ${operatedAtColumn}
                AND ${operatedAtColumn} + ${REFUND_TIME_WINDOW_SECONDS}
            AND ${buildPrefixLikeSql('rejected_payment_refund_tx.title', REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal)}
    )
`;
