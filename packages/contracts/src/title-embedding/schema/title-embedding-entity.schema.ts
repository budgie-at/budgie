import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { TitleEmbeddingEntityTable } from '../table/title-embedding-entity.table';

export const TitleEmbeddingEntitySchema = createSelectSchema(TitleEmbeddingEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('The unique transaction title.'),
    dimensions: schema => schema.describe('The number of dimensions in the embedding vector.')
});
