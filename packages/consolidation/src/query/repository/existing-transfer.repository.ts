import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface
} from '@budgie/contracts';

export class ExistingTransferRepository extends Context.Service<ExistingTransferRepository>()(
    '@budgie/consolidation/ExistingTransferRepository',
    {
        make: Effect.succeed({
            findBridgeCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db => db.$client.unsafe<ExistingTransferBridgeCandidateInterface>(EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope))),
            findChainReclaimCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db =>
                    db.$client.unsafe<ExistingTransferChainReclaimCandidateInterface>(EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope))
                ),
            findIncomeDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db =>
                    db.$client.unsafe<ExistingTransferIncomeDuplicateCandidateInterface>(
                        EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope)
                    )
                )
        })
    }
) {
    static readonly layer = Layer.effect(ExistingTransferRepository, ExistingTransferRepository.make);
}
