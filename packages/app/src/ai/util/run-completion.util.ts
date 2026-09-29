import { GenerateOptionsInterface, stripThinkingTags } from '@budgie/ai';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { DEFAULT_MAX_TOKENS, GENERATION_CONFIG, STOP_TOKENS } from './ai-constants.util';

import type { LlamaContext } from 'llama.rn';

export const runCompletion = Effect.fn('runCompletion')(function* (
    context: LlamaContext,
    systemPrompt: string,
    userMessage: string,
    options?: GenerateOptionsInterface
) {
    const result = yield* Effect.tryPromise(() =>
        context.completion({
            messages: [
                { role: 'system', content: `${systemPrompt}\n/no_think` },
                { role: 'user', content: userMessage }
            ],
            n_predict: options?.maxNewTokens ?? DEFAULT_MAX_TOKENS,
            stop: STOP_TOKENS,
            ...GENERATION_CONFIG,
            ...(isDefined(options?.responseFormat) && {
                response_format: {
                    json_schema: options.responseFormat.jsonSchema,
                    type: options.responseFormat.type
                }
            }),
            ...(isDefined(options?.temperature) ? { temperature: options.temperature } : {})
        })
    );

    if (result.interrupted && options?.throwOnInterrupt === true) {
        return yield* Effect.fail(new Error('completionInterrupted'));
    }

    return stripThinkingTags(result.text.trim());
});
