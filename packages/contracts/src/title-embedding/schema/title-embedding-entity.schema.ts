import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { TitleEmbeddingEntityTable } from '../table/title-embedding-entity.table';

export const TitleEmbeddingEntitySchema = createSelectSchema(TitleEmbeddingEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('The transaction title used for pattern matching joins.'),
    context: schema => schema.describe('The unique context string used for embedding (title + MCC + comment).'),
    embedding: z.instanceof(Uint8Array<ArrayBufferLike>),
    dimensions: schema => schema.describe('The number of dimensions in the embedding vector.')
});
