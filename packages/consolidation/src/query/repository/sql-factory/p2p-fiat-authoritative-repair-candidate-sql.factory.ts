import { AccountTypeEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import {
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA,
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO
} from '../../../shared/constant/transfer-pair-p2p-fiat.constant';

export const buildP2pFiatAuthoritativeRepairCandidateSql = (): string => `
    SELECT DISTINCT canonical.id AS canonicalTransactionId
    FROM transactions canonical
    INNER JOIN transaction_entries p2p_entry
        ON p2p_entry.transaction_id = canonical.id
        AND p2p_entry.original_transaction_id IS NOT NULL
        AND p2p_entry.deleted_at IS NULL
        AND p2p_entry.quoted_instrument_id IS NOT NULL
        AND p2p_entry.quoted_amount > 0
    INNER JOIN accounts p2p_account
        ON p2p_account.id = p2p_entry.account_id
        AND p2p_account.type = '${AccountTypeEnum.CRYPTO_SYNC}'
    WHERE canonical.consolidation_type = '${TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER}'
        AND canonical.updated_by IS NULL
        AND canonical.deleted_at IS NULL
        AND (
            SELECT COUNT(*)
            FROM transaction_entries bank_entry
            INNER JOIN accounts bank_account
                ON bank_account.id = bank_entry.account_id
                AND bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
            WHERE bank_entry.transaction_id = canonical.id
                AND bank_entry.original_transaction_id IS NOT NULL
                AND bank_entry.deleted_at IS NULL
        ) != 1
        AND (
            SELECT COUNT(*)
            FROM transaction_entries bank_entry
            INNER JOIN accounts bank_account
                ON bank_account.id = bank_entry.account_id
                AND bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
                AND bank_account.instrument_id = p2p_entry.quoted_instrument_id
            WHERE bank_entry.transaction_id = canonical.id
                AND bank_entry.original_transaction_id IS NOT NULL
                AND bank_entry.deleted_at IS NULL
                AND bank_entry.amount >= p2p_entry.quoted_amount
                AND bank_entry.amount - p2p_entry.quoted_amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
                AND (bank_entry.amount - p2p_entry.quoted_amount) * 1.0 / p2p_entry.quoted_amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
        ) = 1
`;
