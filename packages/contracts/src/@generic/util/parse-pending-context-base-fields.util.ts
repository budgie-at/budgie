import { isDefined } from '@rnw-community/shared';

import { EmbeddingPendingContextBaseInterface } from '../interface/embedding-pending-context-base.interface';
import { PendingContextBaseRowInterface } from '../interface/pending-context-base-row.interface';

export const parsePendingContextBaseFields = (row: PendingContextBaseRowInterface): EmbeddingPendingContextBaseInterface => ({
    transactionIds: row.transactionIdsCsv.split(',').map(Number),
    tagIds: isDefined(row.tagIdsCsv) ? row.tagIdsCsv.split(',').map(Number) : [],
    existingEmbeddingId: row.existingEmbeddingId,
    categoryId: row.categoryId,
    categoryTitleEn: row.categoryTitleEn
});
