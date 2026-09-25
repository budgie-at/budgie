import type { CategoryScoreResultInterface, MerchantEmbeddingExampleInterface } from '@budgie/contracts';

export interface EmbeddingCategoryEvidenceInterface {
    readonly scores: CategoryScoreResultInterface[];
    readonly examples: MerchantEmbeddingExampleInterface[];
}
