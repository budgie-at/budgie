import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL } from './sql-factory/apple-pay-capture-duplicate-candidate-sql.factory';
import { MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL } from './sql-factory/manual-expense-duplicate-candidate-sql.factory';
import { buildP2pFiatAtomicCandidateSql } from './sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import { buildP2pFiatAuthoritativeCandidateSql } from './sql-factory/p2p-fiat-authoritative-candidate-sql.factory';
import { buildP2pFiatAuthoritativeRepairCandidateSql } from './sql-factory/p2p-fiat-authoritative-repair-candidate-sql.factory';
import { MISSING_TRANSFER_FEE_ENTRIES_SQL } from './sql-factory/transfer-fee-repair-sql.factory';
import { BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL } from './sql-factory/transfer-pair-bridge-claim-repair-sql.factory';
import { TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL, buildTransferPairCandidatesSql } from './sql-factory/transfer-pair-candidate-sql.factory';
import { buildAtmCashWithdrawalCandidatesSql } from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';
import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-supersession-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-duplicate-pair-sql.factory';
import { IBAN_BRIDGE_END_LEG_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-end-leg-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type { FeeEntrySourceInterface } from '../interface/fee-entry-source.interface';
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
            const find = <T extends object>(candidateSql: string) => Db.query(db => db.$client.unsafe<T>(candidateSql));

            return {
                findAtmCashWithdrawalCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(scope)),
                findExistingTransferBridgeCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<ExistingTransferBridgeCandidateInterface>(EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope)),
                findExistingTransferChainReclaimCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<ExistingTransferChainReclaimCandidateInterface>(EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope)),
                findExistingTransferIncomeDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<ExistingTransferIncomeDuplicateCandidateInterface>(EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope)),
                findIbanBridgeTransferCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeTransferCandidateInterface>(IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope)),
                findIbanBridgeCanonicalDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeCanonicalDuplicateCandidateInterface>(IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope)),
                findIbanBridgeCanonicalSupersessionCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeCanonicalSupersessionCandidateInterface>(IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL(scope)),
                findIbanBridgeDuplicatePairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeDuplicatePairCandidateInterface>(IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL(scope)),
                findIbanBridgeEndLegCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeEndLegCandidateInterface>(IBAN_BRIDGE_END_LEG_CANDIDATES_SQL(scope)),
                findIbanBridgeChainTransferCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<IbanBridgeChainTransferCandidateInterface>(IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope)),
                findManualExpenseDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<ManualExpenseDuplicateCandidateInterface>(MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL(scope)),
                findApplePayCaptureDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<ManualExpenseDuplicateCandidateInterface>(APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL(scope)),
                findTransferPairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<TransferPairCandidateInterface>(buildTransferPairCandidatesSql(scope)),
                findP2pFiatAtomicCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<P2pFiatAtomicCandidateInterface>(buildP2pFiatAtomicCandidateSql(scope)),
                findP2pFiatAuthoritativeCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<P2pFiatAuthoritativeCandidateInterface>(buildP2pFiatAuthoritativeCandidateSql(scope)),
                findP2pFiatAuthoritativeRepairCandidates: (scope: ConsolidationScanScopeInterface | null) =>
                    find<P2pFiatAuthoritativeRepairCandidateInterface>(buildP2pFiatAuthoritativeRepairCandidateSql(scope)),
                findBridgeClaimedRepairCandidates: () => find<BridgeClaimRepairCandidateInterface>(BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL),
                findMissingTransferFeeEntries: () => find<FeeEntrySourceInterface>(MISSING_TRANSFER_FEE_ENTRIES_SQL),
                countTransferPairManualReviewCandidates: () =>
                    find<{ readonly count: number }>(TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL).pipe(Effect.map(([row]) => row.count))
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationCandidateRepository, ConsolidationCandidateRepository.make);
}
