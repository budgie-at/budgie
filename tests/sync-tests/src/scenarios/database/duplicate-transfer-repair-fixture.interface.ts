import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

export interface ParentOriginalsInputInterface {
    readonly canonicalTransactionId: number;
    readonly originalTransactionIds: readonly number[];
    readonly createdAt: number;
}

export interface AttachTransferPairOriginalsInputInterface {
    readonly canonicalTransactionId: number;
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly bridgeIban: string;
    readonly suffix: string;
    readonly createdAt: number;
}

export interface AttachIbanBridgeOriginalsInputInterface {
    readonly canonicalTransactionId: number;
    readonly bridgeAccountId: number;
    readonly sourceIban: string;
    readonly targetIban: string;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly suffix: string;
    readonly createdAt: number;
}

export interface SeedCanonicalTransferInputInterface {
    readonly consolidationType: TransactionConsolidationTypeEnum;
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly bridgeAccountId: number;
    readonly sourceIban: string;
    readonly targetIban: string;
    readonly bridgeIban: string;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly suffix: string;
    readonly createdAt: number;
}

export interface SeedDuplicateCanonicalPairInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly bridgeAccountId: number;
    readonly sourceIban: string;
    readonly targetIban: string;
    readonly bridgeIban: string;
    readonly amountSuffix: string;
    readonly sourceAmount?: number;
    readonly targetAmount?: number;
    readonly createdAt?: number;
}

export interface SeedCompetingTransferPairCanonicalInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly bridgeAccountId: number;
    readonly sourceIban: string;
    readonly targetIban: string;
    readonly bridgeIban: string;
    readonly suffix: string;
}

export interface UpsertRepairStoredBalancesInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly updatedAt?: number;
}
