import type { TitleEmbeddingEntitySchema } from '../schema/title-embedding-entity.schema';
import type { infer } from 'zod';

export interface TitleEmbeddingEntityInterface extends infer<typeof TitleEmbeddingEntitySchema> {}
