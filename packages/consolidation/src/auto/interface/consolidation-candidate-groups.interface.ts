import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    RefundReviewCandidateInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export interface ConsolidationCandidateGroupsInterface {
    readonly atmCashWithdrawalCandidates: AtmCashWithdrawalCandidateInterface[];
    readonly atmCashWithdrawalReviewCandidates: AtmCashWithdrawalReviewCandidateInterface[];
    readonly existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[];
    readonly existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[];
    readonly existingTransferIncomeDuplicateCandidates: ExistingTransferIncomeDuplicateCandidateInterface[];
    readonly ibanBridgeCanonicalDuplicateCandidates: IbanBridgeCanonicalDuplicateCandidateInterface[];
    readonly ibanBridgeChainTransferCandidates: IbanBridgeChainTransferCandidateInterface[];
    readonly ibanBridgeTransferCandidates: IbanBridgeTransferCandidateInterface[];
    readonly manualReviewCandidates: TransferPairReviewCandidateInterface[];
    readonly pairCandidates: TransferPairCandidateInterface[];
    readonly refundCandidates: RefundCandidateInterface[];
    readonly refundReviewCandidates: RefundReviewCandidateInterface[];
}
