import { z } from 'zod';

import type { MerchantEmbeddingEntitySchema } from '../schema/merchant-embedding-entity.schema';

export type MerchantEmbeddingEntityInterface = z.infer<typeof MerchantEmbeddingEntitySchema>;
