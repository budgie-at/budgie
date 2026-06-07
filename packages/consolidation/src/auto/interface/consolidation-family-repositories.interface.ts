import type { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';

export interface ConsolidationFamilyRepositoriesInterface {
    readonly atmCashWithdrawalRepository: Pick<AtmCashWithdrawalRepository, 'findCandidates'>;
    readonly existingTransferRepository: Pick<
        ExistingTransferRepository,
        'findBridgeCandidates' | 'findChainReclaimCandidates' | 'findIncomeDuplicateCandidates'
    >;
    readonly ibanBridgeTransferRepository: Pick<
        IbanBridgeTransferRepository,
        'findCanonicalDuplicateCandidates' | 'findChainTransferCandidates' | 'findTransferCandidates'
    >;
    readonly refundPairRepository: Pick<RefundPairRepository, 'findCandidates'>;
    readonly transferPairRepository: Pick<TransferPairRepository, 'findCandidates'>;
}
