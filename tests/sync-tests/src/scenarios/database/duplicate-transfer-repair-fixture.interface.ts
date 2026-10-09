import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

export interface ParentOriginalsInputInterface {
    readonly canonicalTransactionId: number;
    readonly originalTransactionIds: readonly number[];
    readonly createdAt: number;
}

export interface AttachTransferPairOriginalsInputInterface extends Pick<
    SeedCanonicalTransferInputInterface,
    'sourceAccountId' | 'targetAccountId' | 'sourceAmount' | 'targetAmount' | 'bridgeIban' | 'suffix' | 'createdAt'
> {
    readonly canonicalTransactionId: number;
}

export interface AttachIbanBridgeOriginalsInputInterface extends Pick<
    SeedCanonicalTransferInputInterface,
    'bridgeAccountId' | 'sourceIban' | 'targetIban' | 'sourceAmount' | 'targetAmount' | 'suffix' | 'createdAt'
> {
    readonly canonicalTransactionId: number;
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

export interface SeedDuplicateCanonicalPairInputInterface
    extends
        Pick<
            SeedCanonicalTransferInputInterface,
            'sourceAccountId' | 'targetAccountId' | 'bridgeAccountId' | 'sourceIban' | 'targetIban' | 'bridgeIban'
        >,
        Partial<Pick<SeedCanonicalTransferInputInterface, 'sourceAmount' | 'targetAmount' | 'createdAt'>> {
    readonly amountSuffix: string;
}

export interface SeedCompetingTransferPairCanonicalInputInterface extends Pick<
    SeedCanonicalTransferInputInterface,
    'sourceAccountId' | 'targetAccountId' | 'bridgeAccountId' | 'sourceIban' | 'targetIban' | 'bridgeIban' | 'suffix'
> {}

export interface UpsertRepairStoredBalancesInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly updatedAt?: number;
}
