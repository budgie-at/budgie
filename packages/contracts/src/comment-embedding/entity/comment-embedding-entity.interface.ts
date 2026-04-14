import { z } from 'zod';

import type { CommentEmbeddingEntitySchema } from '../schema/comment-embedding-entity.schema';

export type CommentEmbeddingEntityInterface = z.infer<typeof CommentEmbeddingEntitySchema>;
