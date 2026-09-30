import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { buildP2pFiatAtomicCandidateSql } from './sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import { buildP2pFiatAuthoritativeCandidateSql } from './sql-factory/p2p-fiat-authoritative-candidate-sql.factory';
import { buildP2pFiatAuthoritativeRepairCandidateSql } from './sql-factory/p2p-fiat-authoritative-repair-candidate-sql.factory';
import { BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL } from './sql-factory/transfer-pair-bridge-claim-repair-sql.factory';
import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from './sql-factory/transfer-pair-candidate-sql.factory';

import type { P2pFiatAtomicCandidateInterface } from '../interface/p2p-fiat-atomic-candidate.interface';
import type { P2pFiatAuthoritativeCandidateInterface } from '../interface/p2p-fiat-authoritative-candidate.interface';
import type { P2pFiatAuthoritativeRepairCandidateInterface } from '../interface/p2p-fiat-authoritative-repair-candidate.interface';
import type {
    BridgeClaimRepairCandidateInterface,
    ConsolidationScanScopeInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export class TransferPairRepository extends Context.Service<TransferPairRepository>()('@budgie/consolidation/TransferPairRepository', {
    make: Effect.succeed({
        findCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
            Db.query(db => db.$client.getAllAsync<TransferPairCandidateInterface>(buildTransferPairCandidatesSql(scope))),
        findBridgeClaimedRepairCandidates: () =>
            Db.query(db => db.$client.getAllAsync<BridgeClaimRepairCandidateInterface>(BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL)),
        findP2pFiatAtomicCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
            Db.query(db => db.$client.getAllAsync<P2pFiatAtomicCandidateInterface>(buildP2pFiatAtomicCandidateSql(scope))),
        findP2pFiatAuthoritativeCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
            Db.query(db => db.$client.getAllAsync<P2pFiatAuthoritativeCandidateInterface>(buildP2pFiatAuthoritativeCandidateSql(scope))),
        findP2pFiatAuthoritativeRepairCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
            Db.query(db =>
                db.$client.getAllAsync<P2pFiatAuthoritativeRepairCandidateInterface>(buildP2pFiatAuthoritativeRepairCandidateSql(scope))
            ),
        findManualReviewCandidates: () =>
            Db.query(db => db.$client.getAllAsync<TransferPairReviewCandidateInterface>(buildTransferPairManualReviewCandidatesSql()))
    })
}) {
    static readonly layer = Layer.effect(TransferPairRepository, TransferPairRepository.make);
}
