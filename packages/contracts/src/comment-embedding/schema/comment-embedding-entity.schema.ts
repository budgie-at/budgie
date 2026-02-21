import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';

export const CommentEmbeddingEntitySchema = createSelectSchema(CommentEmbeddingEntityTable, {
    ...BaseEntityFields,
    comment: schema => schema.describe('The transaction comment used for embedding context.'),
    categoryId: schema => schema.positive().describe('The category ID associated with this embedding group.'),
    embedding: z.instanceof(Uint8Array<ArrayBufferLike>),
    dimensions: schema => schema.describe('The number of dimensions in the embedding vector.')
});
