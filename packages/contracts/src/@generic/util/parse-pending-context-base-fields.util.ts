import { isDefined } from '@rnw-community/shared';

import { EmbeddingPendingContextBaseInterface } from '../interface/embedding-pending-context-base.interface';

interface PendingContextBaseRowInterface {
    readonly transactionIdsCsv: string;
    readonly tagIdsCsv: string | null;
    readonly existingEmbeddingId: number | null;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
}

export const parsePendingContextBaseFields = (row: PendingContextBaseRowInterface): EmbeddingPendingContextBaseInterface => ({
    transactionIds: row.transactionIdsCsv.split(',').map(Number),
    tagIds: isDefined(row.tagIdsCsv) ? row.tagIdsCsv.split(',').map(Number) : [],
    existingEmbeddingId: row.existingEmbeddingId,
    categoryId: row.categoryId,
    categoryTitleEn: row.categoryTitleEn
});
