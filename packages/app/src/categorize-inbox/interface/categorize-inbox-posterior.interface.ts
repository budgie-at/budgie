import { TransactionTypeEnum } from '@budgie/contracts';

export interface CategorizeInboxPosteriorInterface {
    readonly type: TransactionTypeEnum;
    readonly categoryIds: readonly number[];
    readonly prior: ReadonlyMap<number, number>;
    readonly probabilities: ReadonlyMap<number, number>;
    readonly exactCounts: ReadonlyMap<number, number>;
    readonly normalizedCounts: ReadonlyMap<number, number>;
    readonly prefixCounts: ReadonlyMap<number, number>;
    readonly mccCounts: ReadonlyMap<number, number>;
    readonly embeddingShares: ReadonlyMap<number, number>;
}
