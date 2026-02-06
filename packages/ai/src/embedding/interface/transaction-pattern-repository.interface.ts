import { EmbeddingPatternQueryInterface, RepeatedTransactionPatternInterface } from '@budgie/contracts';

export interface TransactionPatternRepositoryInterface {
    findPatternsByTitles(query: EmbeddingPatternQueryInterface): Promise<RepeatedTransactionPatternInterface[]>;
}
