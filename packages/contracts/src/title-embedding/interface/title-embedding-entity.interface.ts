import { infer } from 'zod';

import { TitleEmbeddingEntitySchema } from '../schema/title-embedding-entity.schema';

export interface TitleEmbeddingEntityInterface extends infer<typeof TitleEmbeddingEntitySchema> {}
