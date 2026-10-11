import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-supersession-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface
} from '@budgie/contracts';

export class IbanBridgeTransferRepository extends Context.Service<IbanBridgeTransferRepository>()(
    '@budgie/consolidation/IbanBridgeTransferRepository',
    {
        make: Effect.succeed({
            findTransferCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db => db.$client.unsafe<IbanBridgeTransferCandidateInterface>(IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope))),
            findCanonicalDuplicateCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db =>
                    db.$client.unsafe<IbanBridgeCanonicalDuplicateCandidateInterface>(IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope))
                ),
            findCanonicalSupersessionCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db =>
                    db.$client.unsafe<IbanBridgeCanonicalSupersessionCandidateInterface>(
                        IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL(scope)
                    )
                ),
            findChainTransferCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db =>
                    db.$client.unsafe<IbanBridgeChainTransferCandidateInterface>(IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope))
                )
        })
    }
) {
    static readonly layer = Layer.effect(IbanBridgeTransferRepository, IbanBridgeTransferRepository.make);
}
