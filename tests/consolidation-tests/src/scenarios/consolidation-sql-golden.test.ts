import { describe, expect, it } from '@effect/vitest';

import { APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/apple-pay-capture-duplicate-candidate-sql.factory';
import { buildHouseholdManualAccountTransferCandidatesSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/household-manual-account-transfer-candidate-sql.factory';
import { MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/manual-expense-duplicate-candidate-sql.factory';
import { buildP2pFiatAtomicCandidateSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import { buildP2pFiatAuthoritativeCandidateSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/p2p-fiat-authoritative-candidate-sql.factory';
import { buildP2pFiatAuthoritativeRepairCandidateSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/p2p-fiat-authoritative-repair-candidate-sql.factory';
import {
    REFUND_AUTO_CANDIDATES_SQL,
    REFUND_REVIEW_CANDIDATES_SQL
} from '../../../../packages/consolidation/src/query/repository/sql-factory/refund-ranked-candidate-sql.factory';
import { REFUNDABLE_EXPENSE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/refundable-expense-candidate-sql.factory';
import { MISSING_TRANSFER_FEE_ENTRIES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-fee-repair-sql.factory';
import { TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-available-exchange-rates-sql.factory';
import { BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-bridge-claim-repair-sql.factory';
import {
    TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL,
    buildTransferPairCandidatesSql
} from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-candidate-sql.factory';
import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAutoAtmCashWithdrawalCandidatesSql
} from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-cash-withdrawal-sql.factory';
import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';
import { EXISTING_TRANSFER_LEGACY_CSV_DUPLICATE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-existing-transfer-legacy-csv-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-canonical-supersession-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-duplicate-pair-sql.factory';
import { IBAN_BRIDGE_END_LEG_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-end-leg-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';
import { buildTransferPairRankedCandidateBaseSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-ranked-candidate-base-sql.factory';
import { TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-ranked-candidate-rank-sql.factory';
import { buildTransferPairRankedCandidateSql } from '../../../../packages/consolidation/src/query/repository/sql-factory/transfer-pair-ranked-candidate-sql.factory';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const SCOPES: Record<string, ConsolidationScanScopeInterface | null> = {
    unscoped: null,
    windowOnly: { operatedAtFrom: new Date(1_700_000_000_500), operatedAtTo: new Date(1_700_086_400_500), transactionIds: [] },
    windowWithIds: { operatedAtFrom: new Date(1_700_000_000_500), operatedAtTo: new Date(1_700_086_400_500), transactionIds: [11, 42] }
};

const SCOPED_FACTORIES: Record<string, (scope: ConsolidationScanScopeInterface | null) => string> = {
    APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL,
    buildHouseholdManualAccountTransferCandidatesSql,
    MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL,
    buildP2pFiatAtomicCandidateSql,
    buildP2pFiatAuthoritativeCandidateSql,
    buildP2pFiatAuthoritativeRepairCandidateSql,
    REFUND_AUTO_CANDIDATES_SQL,
    buildTransferPairCandidatesSql,
    buildAtmCashWithdrawalCandidatesSql,
    buildAutoAtmCashWithdrawalCandidatesSql,
    EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL,
    EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL,
    EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL,
    IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL,
    IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL,
    IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL,
    IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL,
    IBAN_BRIDGE_END_LEG_CANDIDATES_SQL,
    IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL,
    buildTransferPairRankedCandidateSql,
    buildTransferPairRankedCandidateBaseSql
};

const STATIC_SQL: Record<string, string> = {
    REFUND_REVIEW_CANDIDATES_SQL,
    REFUNDABLE_EXPENSE_CANDIDATES_SQL,
    MISSING_TRANSFER_FEE_ENTRIES_SQL,
    TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL,
    BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL,
    TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL,
    EXISTING_TRANSFER_LEGACY_CSV_DUPLICATE_CANDIDATES_SQL,
    TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL
};

describe('consolidation/sql-golden', () => {
    for (const [factoryName, factory] of Object.entries(SCOPED_FACTORIES)) {
        for (const [scopeName, scope] of Object.entries(SCOPES)) {
            it(`${factoryName} ${scopeName}`, () => {
                expect(factory(scope)).toMatchSnapshot();
            });
        }
    }

    for (const [sqlName, sql] of Object.entries(STATIC_SQL)) {
        it(`static ${sqlName}`, () => {
            expect(sql).toMatchSnapshot();
        });
    }
});
