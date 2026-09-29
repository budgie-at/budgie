import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

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

export class TransferPairRepository {
    readonly findCandidates = Effect.fn('TransferPairRepository.findCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = buildTransferPairCandidatesSql(scope);

        return yield* Db.query(db => db.$client.getAllAsync<TransferPairCandidateInterface>(sql));
    });

    readonly findBridgeClaimedRepairCandidates = Effect.fn('TransferPairRepository.findBridgeClaimedRepairCandidates')(function* () {
        return yield* Db.query(db => db.$client.getAllAsync<BridgeClaimRepairCandidateInterface>(BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL));
    });

    readonly findP2pFiatAtomicCandidates = Effect.fn('TransferPairRepository.findP2pFiatAtomicCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = buildP2pFiatAtomicCandidateSql(scope);

        return yield* Db.query(db => db.$client.getAllAsync<P2pFiatAtomicCandidateInterface>(sql));
    });

    readonly findP2pFiatAuthoritativeCandidates = Effect.fn('TransferPairRepository.findP2pFiatAuthoritativeCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        return yield* Db.query(db =>
            db.$client.getAllAsync<P2pFiatAuthoritativeCandidateInterface>(buildP2pFiatAuthoritativeCandidateSql(scope))
        );
    });

    readonly findP2pFiatAuthoritativeRepairCandidates = Effect.fn('TransferPairRepository.findP2pFiatAuthoritativeRepairCandidates')(
        function* (scope: ConsolidationScanScopeInterface | null = null) {
            return yield* Db.query(db =>
                db.$client.getAllAsync<P2pFiatAuthoritativeRepairCandidateInterface>(buildP2pFiatAuthoritativeRepairCandidateSql(scope))
            );
        }
    );

    readonly findManualReviewCandidates = Effect.fn('TransferPairRepository.findManualReviewCandidates')(function* () {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return yield* Db.query(db => db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql));
    });
}
