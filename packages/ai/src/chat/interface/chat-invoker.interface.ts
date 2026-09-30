import type { AiInvokeError } from '../../@generic/error/ai-invoke.error';
import type { GenerateOptionsInterface } from '../../@generic/interface/generate-options.interface';
import type * as Effect from 'effect/Effect';

export interface ChatInvokerInterface {
    readonly isReady: boolean;
    generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Effect.Effect<string, AiInvokeError>;
}
