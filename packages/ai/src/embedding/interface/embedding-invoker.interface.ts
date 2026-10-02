import type { AiInvokeError } from '../../@generic/error/ai-invoke.error';
import type * as Effect from 'effect/Effect';

export interface EmbeddingInvokerInterface {
    readonly isReady: boolean;
    embed(text: string): Effect.Effect<number[], AiInvokeError>;
    batchEmbed(texts: readonly string[]): Effect.Effect<Map<string, number[]>, AiInvokeError>;
}
