import type { CommentEmbeddingEntitySchema } from '../schema/comment-embedding-entity.schema';
import type { infer } from 'zod';

export interface CommentEmbeddingEntityInterface extends infer<typeof CommentEmbeddingEntitySchema> {}
