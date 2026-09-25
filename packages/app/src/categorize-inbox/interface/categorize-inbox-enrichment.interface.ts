import { CategoryScoreResultInterface } from '@budgie/contracts';

export interface CategorizeInboxEnrichmentInterface {
    readonly embeddingScores: CategoryScoreResultInterface[];
    readonly llmCategoryId: number | null;
}
