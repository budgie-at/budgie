import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';

export interface ConsolidationCandidateDependenciesInterface {
    readonly refundPairRepository: Pick<RefundPairRepository, 'findCandidates' | 'findReviewCandidates'>;
    readonly transferPairRepository: Pick<
        TransferPairRepository,
        | 'findAtmCashWithdrawalCandidates'
        | 'findAtmCashWithdrawalReviewCandidates'
        | 'findCandidates'
        | 'findExistingTransferBridgeCandidates'
        | 'findExistingTransferChainReclaimCandidates'
        | 'findExistingTransferIncomeDuplicateCandidates'
        | 'findIbanBridgeCanonicalDuplicateCandidates'
        | 'findIbanBridgeChainTransferCandidates'
        | 'findIbanBridgeTransferCandidates'
        | 'findManualReviewCandidates'
    >;
}
