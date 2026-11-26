import {
    AccountTypeEnum,
    Db,
    ExternalSourceEnum,
    HOUSEHOLD_SYNC_ZONE,
    TransactionConsolidationTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ConsolidationRunCapabilities } from '../../auto/state/consolidation-run-capabilities';

import { APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL } from './sql-factory/apple-pay-capture-duplicate-candidate-sql.factory';
import { buildHouseholdManualAccountTransferCandidatesSql } from './sql-factory/household-manual-account-transfer-candidate-sql.factory';
import { MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL } from './sql-factory/manual-expense-duplicate-candidate-sql.factory';
import { buildP2pFiatAtomicCandidateSql } from './sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import { buildP2pFiatAuthoritativeCandidateSql } from './sql-factory/p2p-fiat-authoritative-candidate-sql.factory';
import { buildP2pFiatAuthoritativeRepairCandidateSql } from './sql-factory/p2p-fiat-authoritative-repair-candidate-sql.factory';
import { MISSING_TRANSFER_FEE_ENTRIES_SQL } from './sql-factory/transfer-fee-repair-sql.factory';
import { BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL } from './sql-factory/transfer-pair-bridge-claim-repair-sql.factory';
import { TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL, buildTransferPairCandidatesSql } from './sql-factory/transfer-pair-candidate-sql.factory';
import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAutoAtmCashWithdrawalCandidatesSql
} from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';
import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-supersession-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-duplicate-pair-sql.factory';
import { IBAN_BRIDGE_END_LEG_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-end-leg-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type { ConsolidationRunCapabilitiesRowInterface } from '../interface/consolidation-run-capabilities-row.interface';
import type { FeeEntrySourceInterface } from '../interface/fee-entry-source.interface';
import type { HouseholdManualAccountTransferCandidateInterface } from '../interface/household-manual-account-transfer-candidate.interface';
import type { IbanBridgeDuplicatePairCandidateInterface } from '../interface/iban-bridge-duplicate-pair-candidate.interface';
import type { IbanBridgeEndLegCandidateInterface } from '../interface/iban-bridge-end-leg-candidate.interface';
import type { ManualExpenseDuplicateCandidateInterface } from '../interface/manual-expense-duplicate-candidate.interface';
import type { P2pFiatAtomicCandidateInterface } from '../interface/p2p-fiat-atomic-candidate.interface';
import type { P2pFiatAuthoritativeCandidateInterface } from '../interface/p2p-fiat-authoritative-candidate.interface';
import type { P2pFiatAuthoritativeRepairCandidateInterface } from '../interface/p2p-fiat-authoritative-repair-candidate.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    BridgeClaimRepairCandidateInterface,
    ConsolidationScanScopeInterface,
    DbError,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCandidateRepository extends Context.Service<ConsolidationCandidateRepository>()(
    '@budgie/consolidation/ConsolidationCandidateRepository',
    {
        make: Effect.sync(() => {
            const runCapabilitiesSql = `
                SELECT
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type = '${TransactionTypeEnum.EXPENSE}') AS hasVisibleExpenses,
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type = '${TransactionTypeEnum.INCOME}') AS hasVisibleIncomes,
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type = '${TransactionTypeEnum.TRANSFER}') AS hasVisibleTransfers,
                    EXISTS (SELECT 1 FROM accounts WHERE deleted_at IS NULL AND is_active = 1 AND iban IS NOT NULL AND iban != '') AS hasIbanAccounts,
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type = '${TransactionTypeEnum.TRANSFER}' AND consolidation_type IN ('${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}', '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}')) AS hasIbanBridgeCanonicals,
                    EXISTS (SELECT 1 FROM accounts WHERE deleted_at IS NULL AND is_active = 1 AND type = '${AccountTypeEnum.CRYPTO_SYNC}') AS hasCryptoAccounts,
                    EXISTS (SELECT 1 FROM accounts WHERE deleted_at IS NULL AND is_active = 1 AND type = '${AccountTypeEnum.CASH}') AS hasActiveCashAccounts,
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type = '${TransactionTypeEnum.EXPENSE}' AND external_source IN ('${ExternalSourceEnum.APPLE_PAY_AUTOMATION}', '${ExternalSourceEnum.RECEIPT}')) AS hasApplePayOrReceipt,
                    EXISTS (SELECT 1 FROM transactions WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND type IN ('${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}') AND (external_source IS NULL OR external_source IN ('${ExternalSourceEnum.MANUAL}', '${ExternalSourceEnum.CSV}', '${ExternalSourceEnum.RECEIPT}'))) AS hasManualExpenses,
                    EXISTS (SELECT 1 FROM accounts WHERE deleted_at IS NULL AND is_active = 1 AND iban IS NOT NULL AND iban != '' AND sync_zone = '${HOUSEHOLD_SYNC_ZONE}' AND integration_id IS NULL AND (external_source IS NULL OR external_source = '')) AS hasHouseholdManualAccounts,
                    (SELECT COUNT(*) FROM (SELECT 1 FROM accounts WHERE deleted_at IS NULL AND is_active = 1 LIMIT 2)) >= 2 AS hasMultipleActiveAccounts
            `;

            const find = <T extends object>(candidateSql: string) => Db.query(db => db.$client.unsafe<T>(candidateSql));

            const findGated = <T extends object>(
                isEligible: (capabilities: ConsolidationRunCapabilities) => boolean,
                buildCandidateSql: () => string
            ): Effect.Effect<readonly T[], DbError, Db> =>
                Effect.flatMap(ConsolidationCandidateRepository.RunCapabilities, capabilities =>
                    isDefined(capabilities) && !isEligible(capabilities) ? Effect.succeed([]) : find<T>(buildCandidateSql())
                );

            return {
                loadRunCapabilities: find<ConsolidationRunCapabilitiesRowInterface>(runCapabilitiesSql).pipe(
                    Effect.map(([row]) => (isDefined(row) ? new ConsolidationRunCapabilities(row) : null))
                ),
                findConsolidationParentIds: (transactionIds: readonly number[]) =>
                    isNotEmptyArray(transactionIds)
                        ? find<{ readonly parentId: number }>(
                              `SELECT DISTINCT consolidation_parent_transaction_id AS parentId
                               FROM transactions
                               WHERE id IN (${transactionIds.join(',')})
                                   AND deleted_at IS NULL
                                   AND consolidation_parent_transaction_id IS NOT NULL`
                          ).pipe(Effect.map(rows => rows.map(row => row.parentId)))
                        : Effect.succeed([]),
                findConsolidationChildIds: (canonicalTransactionIds: readonly number[]) =>
                    isNotEmptyArray(canonicalTransactionIds)
                        ? find<{ readonly id: number }>(
                              `SELECT id
                               FROM transactions
                               WHERE consolidation_parent_transaction_id IN (${canonicalTransactionIds.join(',')})
                                   AND deleted_at IS NULL`
                          ).pipe(Effect.map(rows => rows.map(row => row.id)))
                        : Effect.succeed([]),
                findHouseholdManualAccountTransferCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<HouseholdManualAccountTransferCandidateInterface>(
                        capabilities =>
                            capabilities.hasHouseholdManualAccounts && (capabilities.hasVisibleExpenses || capabilities.hasVisibleIncomes),
                        () => buildHouseholdManualAccountTransferCandidatesSql(scope)
                    ),
                findAtmCashWithdrawalCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<AtmCashWithdrawalCandidateInterface>(
                        capabilities => capabilities.hasActiveCashAccounts && capabilities.hasVisibleExpenses,
                        () => buildAtmCashWithdrawalCandidatesSql(scope)
                    ),
                findAtmCashWithdrawalCandidatesByIds: (transactionIds: readonly number[]) =>
                    isNotEmptyArray(transactionIds)
                        ? find<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(null, transactionIds))
                        : Effect.succeed([]),
                findAutoAtmCashWithdrawalCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<AtmCashWithdrawalCandidateInterface>(
                        capabilities => capabilities.hasActiveCashAccounts && capabilities.hasVisibleExpenses,
                        () => buildAutoAtmCashWithdrawalCandidatesSql(scope)
                    ),
                findExistingTransferBridgeCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<ExistingTransferBridgeCandidateInterface>(
                        capabilities =>
                            capabilities.hasVisibleTransfers && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope)
                    ),
                findExistingTransferChainReclaimCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<ExistingTransferChainReclaimCandidateInterface>(
                        capabilities =>
                            capabilities.hasIbanAccounts &&
                            capabilities.hasVisibleTransfers &&
                            capabilities.hasVisibleExpenses &&
                            capabilities.hasVisibleIncomes,
                        () => EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope)
                    ),
                findExistingTransferIncomeDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<ExistingTransferIncomeDuplicateCandidateInterface>(
                        capabilities =>
                            capabilities.hasVisibleTransfers && (capabilities.hasVisibleIncomes || capabilities.hasVisibleExpenses),
                        () => EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeTransferCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeTransferCandidateInterface>(
                        capabilities => capabilities.hasIbanAccounts && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeCanonicalDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeCanonicalDuplicateCandidateInterface>(
                        capabilities =>
                            capabilities.hasIbanBridgeCanonicals && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeCanonicalSupersessionCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeCanonicalSupersessionCandidateInterface>(
                        capabilities => capabilities.hasIbanBridgeCanonicals && capabilities.hasVisibleTransfers,
                        () => IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeDuplicatePairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeDuplicatePairCandidateInterface>(
                        capabilities => capabilities.hasIbanBridgeCanonicals && capabilities.hasVisibleTransfers,
                        () => IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeEndLegCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeEndLegCandidateInterface>(
                        capabilities =>
                            capabilities.hasIbanBridgeCanonicals && (capabilities.hasVisibleExpenses || capabilities.hasVisibleIncomes),
                        () => IBAN_BRIDGE_END_LEG_CANDIDATES_SQL(scope)
                    ),
                findIbanBridgeChainTransferCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<IbanBridgeChainTransferCandidateInterface>(
                        capabilities => capabilities.hasIbanAccounts && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope)
                    ),
                findManualExpenseDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<ManualExpenseDuplicateCandidateInterface>(
                        capabilities => capabilities.hasManualExpenses,
                        () => MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL(scope)
                    ),
                findApplePayCaptureDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<ManualExpenseDuplicateCandidateInterface>(
                        capabilities => capabilities.hasApplePayOrReceipt,
                        () => APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL(scope)
                    ),
                findTransferPairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<TransferPairCandidateInterface>(
                        capabilities =>
                            capabilities.hasMultipleActiveAccounts && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => buildTransferPairCandidatesSql(scope)
                    ),
                findP2pFiatAtomicCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<P2pFiatAtomicCandidateInterface>(
                        capabilities => capabilities.hasCryptoAccounts && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => buildP2pFiatAtomicCandidateSql(scope)
                    ),
                findP2pFiatAuthoritativeCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<P2pFiatAuthoritativeCandidateInterface>(
                        capabilities => capabilities.hasCryptoAccounts && capabilities.hasVisibleExpenses && capabilities.hasVisibleIncomes,
                        () => buildP2pFiatAuthoritativeCandidateSql(scope)
                    ),
                findP2pFiatAuthoritativeRepairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    findGated<P2pFiatAuthoritativeRepairCandidateInterface>(
                        capabilities => capabilities.hasCryptoAccounts && capabilities.hasVisibleTransfers,
                        () => buildP2pFiatAuthoritativeRepairCandidateSql(scope)
                    ),
                findBridgeClaimedRepairCandidates: find<BridgeClaimRepairCandidateInterface>(BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL),
                findMissingTransferFeeEntries: findGated<FeeEntrySourceInterface>(
                    capabilities => capabilities.hasVisibleTransfers,
                    () => MISSING_TRANSFER_FEE_ENTRIES_SQL
                ),
                countTransferPairManualReviewCandidates: find<{ readonly count: number }>(TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL).pipe(
                    Effect.map(([row]) => row.count)
                )
            };
        })
    }
) {
    static readonly RunCapabilities = Context.Reference<ConsolidationRunCapabilities | null>(
        '@budgie/consolidation/ConsolidationCandidateRepository/RunCapabilities',
        {
            defaultValue: () => null
        }
    );

    static readonly layer = Layer.effect(ConsolidationCandidateRepository, ConsolidationCandidateRepository.make);
}
