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
            findBridgeCandidates: Effect.fn('ExistingTransferRepository.findBridgeCandidates')(function* (
                scope: ConsolidationScanScopeInterface | null = null
            ) {
                const sql = EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope);

                return yield* Db.query(db => db.$client.unsafe<ExistingTransferBridgeCandidateInterface>(sql));
            }),
            findChainReclaimCandidates: Effect.fn('ExistingTransferRepository.findChainReclaimCandidates')(function* (
                scope: ConsolidationScanScopeInterface | null = null
            ) {
                const sql = EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope);

                return yield* Db.query(db => db.$client.unsafe<ExistingTransferChainReclaimCandidateInterface>(sql));
            }),
            findIncomeDuplicateCandidates: Effect.fn('ExistingTransferRepository.findIncomeDuplicateCandidates')(function* (
                scope: ConsolidationScanScopeInterface | null = null
            ) {
                const sql = EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope);

                return yield* Db.query(db => db.$client.unsafe<ExistingTransferIncomeDuplicateCandidateInterface>(sql));
            })
        })
    }
) {
    static readonly layer = Layer.effect(ExistingTransferRepository, ExistingTransferRepository.make);
}
