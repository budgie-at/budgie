export interface IbanBridgeCanonicalSupersessionCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_CANONICAL_SUPERSESSION';
    readonly supersededCanonicalTransactionId: number;
    readonly canonicalTransactionId: number;
    readonly sourceAccountId: number;
    readonly bridgeAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly timeDiff: number;
}
