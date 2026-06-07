import type { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';

export interface ConsolidationCandidateRepositoriesInterface {
    readonly atmCashWithdrawalRepository: Pick<AtmCashWithdrawalRepository, 'findReviewCandidates'>;
    readonly existingTransferRepository: Pick<
        ExistingTransferRepository,
        'findBridgeCandidates' | 'findChainReclaimCandidates' | 'findIncomeDuplicateCandidates'
    >;
    readonly refundPairRepository: Pick<RefundPairRepository, 'findReviewCandidates'>;
    readonly transferPairRepository: Pick<TransferPairRepository, 'findManualReviewCandidates'>;
}
