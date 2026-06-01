import type { RefundPairRepository, TransferPairRepository } from '@budgie/contracts';

export interface ConsolidationCandidateDependenciesInterface {
    readonly refundPairRepository: Pick<RefundPairRepository, 'findCandidates' | 'findReviewCandidates'>;
    readonly transferPairRepository: Pick<
        TransferPairRepository,
        | 'findAtmCashWithdrawalCandidates'
        | 'findAtmCashWithdrawalReviewCandidates'
        | 'findCandidates'
        | 'findExistingTransferBridgeCandidates'
        | 'findExistingTransferIncomeDuplicateCandidates'
        | 'findIbanBridgeCanonicalDuplicateCandidates'
        | 'findIbanBridgeChainTransferCandidates'
        | 'findIbanBridgeTransferCandidates'
        | 'findManualReviewCandidates'
    >;
}
