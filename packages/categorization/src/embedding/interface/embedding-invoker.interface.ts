import type { AiInvokeError } from '@budgie/ai';
import type * as Effect from 'effect/Effect';

export interface EmbeddingInvokerInterface {
    embed(text: string): Effect.Effect<number[], AiInvokeError>;
}
