export interface IbanBridgeEndLegCandidateInterface {
    readonly canonicalTransactionId: number;
    readonly bridgeOriginTransactionId: number;
    readonly accountId: number;
    readonly endLegTransactionId: number;
}
