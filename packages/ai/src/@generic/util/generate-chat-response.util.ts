import * as Effect from 'effect/Effect';

import { AiInvokeError } from '../error/ai-invoke.error';

import type { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import type { GenerateOptionsInterface } from '../interface/generate-options.interface';

export const generateChatResponse = (
    chat: ChatInvokerInterface,
    ...[systemPrompt, userMessage, options]: [string, string, GenerateOptionsInterface?]
): Effect.Effect<string, AiInvokeError> =>
    Effect.tryPromise({
        try: () => chat.generate(systemPrompt, userMessage, options),
        catch: cause => new AiInvokeError({ cause })
    }).pipe(
        Effect.onInterrupt(() =>
            Effect.sync(() => {
                chat.interrupt();
            })
        )
    );
