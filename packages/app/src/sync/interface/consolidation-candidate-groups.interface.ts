import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    RefundReviewCandidateInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export interface ConsolidationCandidateGroupsInterface {
    readonly atmCashWithdrawalCandidates: AtmCashWithdrawalCandidateInterface[];
    readonly atmCashWithdrawalReviewCandidates: AtmCashWithdrawalReviewCandidateInterface[];
    readonly ibanBridgeTransferCandidates: IbanBridgeTransferCandidateInterface[];
    readonly manualReviewCandidates: TransferPairReviewCandidateInterface[];
    readonly pairCandidates: TransferPairCandidateInterface[];
    readonly refundCandidates: RefundCandidateInterface[];
    readonly refundReviewCandidates: RefundReviewCandidateInterface[];
}
