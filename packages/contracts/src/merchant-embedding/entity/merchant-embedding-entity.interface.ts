import type { MerchantEmbeddingEntitySchema } from '../schema/merchant-embedding-entity.schema';
import type { infer } from 'zod';

export interface MerchantEmbeddingEntityInterface extends infer<typeof MerchantEmbeddingEntitySchema> {}
