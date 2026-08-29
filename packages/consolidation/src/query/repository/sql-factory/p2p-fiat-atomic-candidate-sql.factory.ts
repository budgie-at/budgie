import { TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-p2p-fiat.constant';

import { buildTransferPairRankedCandidateBaseSql } from './transfer-pair-ranked-candidate-base-sql.factory';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildP2pFiatAtomicCandidateSql = (scope: ConsolidationScanScopeInterface | null): string => `
    ${buildTransferPairRankedCandidateBaseSql(scope)}
    p2p_fiat_atomic_candidates AS (
        SELECT
            expenseTransactionId,
            expenseOperatedAt,
            expenseAccountId as expenseEntryAccountId,
            expenseEntryAmount,
            expenseEntryExchangeRate,
            expenseEntryToIban,
            expenseAccountType,
            expenseCurrency,
            incomeTransactionId,
            incomeOperatedAt,
            incomeAccountId as incomeEntryAccountId,
            incomeEntryAmount,
            incomeEntryExchangeRate,
            incomeEntryToIban,
            incomeAccountType,
            incomeCurrency,
            expectedExchangeRate,
            timeDiff
        FROM scored_pairs_base
        WHERE p2pCrossCurrencyMatch = 1
            AND timeDiff <= ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND expectedExchangeRate IS NOT NULL
    )
    SELECT * FROM p2p_fiat_atomic_candidates
`;
