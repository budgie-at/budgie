import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
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
    readonly ibanBridgeChainTransferCandidates: IbanBridgeChainTransferCandidateInterface[];
    readonly ibanBridgeTransferCandidates: IbanBridgeTransferCandidateInterface[];
    readonly manualReviewCandidates: TransferPairReviewCandidateInterface[];
    readonly pairCandidates: TransferPairCandidateInterface[];
    readonly refundCandidates: RefundCandidateInterface[];
    readonly refundReviewCandidates: RefundReviewCandidateInterface[];
}
