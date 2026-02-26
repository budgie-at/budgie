import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';

export const MerchantEmbeddingEntitySchema = createSelectSchema(MerchantEmbeddingEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('The merchant title used for embedding context.'),
    mccDescription: schema => schema.describe('The MCC full description for the merchant.'),
    categoryId: schema => schema.positive().describe('The category ID associated with this embedding group.'),
    comment: schema => schema.describe('The most recent comment for this merchant+category combination.'),
    embedding: z.instanceof(Uint8Array<ArrayBufferLike>),
    dimensions: schema => schema.describe('The number of dimensions in the embedding vector.')
});
