import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export interface ConsolidationCandidateGroupsInterface {
    readonly atmCashWithdrawalCandidates: AtmCashWithdrawalCandidateInterface[];
    readonly atmCashWithdrawalReviewCandidates: AtmCashWithdrawalReviewCandidateInterface[];
    readonly ibanBridgeTransferCandidates: IbanBridgeTransferCandidateInterface[];
    readonly manualReviewCandidates: TransferPairReviewCandidateInterface[];
    readonly pairCandidates: TransferPairCandidateInterface[];
}
