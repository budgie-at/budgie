import { GenerateOptionsInterface, stripThinkingTags } from '@budgie/ai';
import { LlamaContext } from 'llama.rn';

import { isDefined } from '@rnw-community/shared';

import { DEFAULT_MAX_TOKENS, GENERATION_CONFIG, STOP_TOKENS } from './ai-constants.util';

export const runCompletion = async (
    context: LlamaContext,
    systemPrompt: string,
    userMessage: string,
    options?: GenerateOptionsInterface
): Promise<string> => {
    const result = await context.completion({
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
    });

    return stripThinkingTags(result.text.trim());
};
