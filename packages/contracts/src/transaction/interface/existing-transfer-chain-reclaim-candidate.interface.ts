import type { IbanBridgeChainTransferCandidateInterface } from './iban-bridge-chain-transfer-candidate.interface';

export interface ExistingTransferChainReclaimCandidateInterface extends Pick<
    IbanBridgeChainTransferCandidateInterface,
    | 'bridgeIncomeTransactionId'
    | 'bridgeIncomeTransactionTitle'
    | 'bridgeExpenseTransactionId'
    | 'bridgeExpenseTransactionTitle'
    | 'operatedAt'
    | 'sourceAccountId'
    | 'sourceAccountTitle'
    | 'bridgeAccountId'
    | 'bridgeAccountTitle'
    | 'targetAccountId'
    | 'targetAccountTitle'
    | 'sourceAmount'
    | 'bridgeAmount'
    | 'targetAmount'
    | 'exchangeRate'
    | 'timeDiff'
> {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_CHAIN_RECLAIM';
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly targetAccountIban: string;
}
