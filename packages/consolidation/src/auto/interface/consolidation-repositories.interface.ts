import type { AtmCashWithdrawalRepository } from '../../query/repository/atm-cash-withdrawal.repository';
import type { ExistingTransferRepository } from '../../query/repository/existing-transfer.repository';
import type { IbanBridgeTransferRepository } from '../../query/repository/iban-bridge-transfer.repository';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';

export interface ConsolidationRepositoriesInterface {
    readonly atmCashWithdrawalRepository: AtmCashWithdrawalRepository;
    readonly existingTransferRepository: ExistingTransferRepository;
    readonly ibanBridgeTransferRepository: IbanBridgeTransferRepository;
    readonly refundPairRepository: RefundPairRepository;
    readonly transferPairRepository: TransferPairRepository;
}
