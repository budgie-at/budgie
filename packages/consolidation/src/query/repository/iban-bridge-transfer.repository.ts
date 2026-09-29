import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

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

export class IbanBridgeTransferRepository {
    readonly findTransferCandidates = Effect.fn('IbanBridgeTransferRepository.findTransferCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope);

        return yield* Db.query(db => db.$client.getAllAsync<IbanBridgeTransferCandidateInterface>(sql));
    });

    readonly findCanonicalDuplicateCandidates = Effect.fn('IbanBridgeTransferRepository.findCanonicalDuplicateCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope);

        return yield* Db.query(db => db.$client.getAllAsync<IbanBridgeCanonicalDuplicateCandidateInterface>(sql));
    });

    readonly findCanonicalSupersessionCandidates = Effect.fn('IbanBridgeTransferRepository.findCanonicalSupersessionCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL(scope);

        return yield* Db.query(db => db.$client.getAllAsync<IbanBridgeCanonicalSupersessionCandidateInterface>(sql));
    });

    readonly findChainTransferCandidates = Effect.fn('IbanBridgeTransferRepository.findChainTransferCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope);

        return yield* Db.query(db => db.$client.getAllAsync<IbanBridgeChainTransferCandidateInterface>(sql));
    });
}
