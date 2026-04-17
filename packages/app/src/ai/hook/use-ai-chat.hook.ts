/* eslint-disable lingui/no-unlocalized-strings -- Internal error strings, not user-facing */
import { GenerateOptionsInterface } from '@budgie/ai';
import { LlamaContext } from 'llama.rn';
import { type RefObject, useRef } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { AiModeEnum } from '../enum/ai-mode.enum';
import { runCompletion } from '../util/run-completion.util';
import { isNativeCallSafe } from '../utils/is-native-call-safe.util';

interface UseAiChatParamsInterface {
    readonly chatContextRef: RefObject<LlamaContext | null>;
    readonly modeRef: RefObject<AiModeEnum>;
}

interface UseAiChatResultInterface {
    readonly generate: (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface) => Promise<string>;
    readonly interrupt: () => void;
}

export const useAiChat = ({ chatContextRef, modeRef }: UseAiChatParamsInterface): UseAiChatResultInterface => {
    const mutexRef = useRef<Promise<unknown>>(Promise.resolve());

    const generate = async (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> => {
        if (!isNativeCallSafe(modeRef.current)) {
            throw new Error('AI not ready or app not active');
        }
        if (!isDefined(chatContextRef.current)) {
            throw new Error('Model not loaded');
        }

        const runFn = async (): Promise<string> => {
            if (!isDefined(chatContextRef.current)) {
                throw new Error('Model released');
            }

            return runCompletion(chatContextRef.current, systemPrompt, userMessage, options);
        };
        const current = mutexRef.current.then(runFn, runFn);
        mutexRef.current = current.catch(emptyFn);

        return current;
    };

    const interrupt = (): void => {
        void chatContextRef.current?.stopCompletion();
    };

    return { generate, interrupt };
};
