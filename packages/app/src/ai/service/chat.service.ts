import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../util/ai-constants.util';
import { runCompletion } from '../util/run-completion.util';

import { LlamaModelService } from './llama-model.service';

import type { ChatInvokerInterface, GenerateOptionsInterface } from '@budgie/ai';

class ChatService implements ChatInvokerInterface {
    readonly model = new LlamaModelService({
        modelUrl: CHAT_MODEL_URL,
        modelFilename: CHAT_MODEL_FILENAME,
        contextSize: CHAT_CONTEXT_SIZE,
        embedding: false
    });

    private readonly completionLock = Semaphore.makeUnsafe(1);

    get isReady(): boolean {
        return this.model.isReady;
    }

    generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        return Effect.runPromise(
            this.completionLock.withPermit(
                Effect.suspend(() => {
                    const { context } = this.model;

                    return this.isReady && isDefined(context)
                        ? runCompletion(context, systemPrompt, userMessage, options)
                        : Effect.fail(new AiNotReadyError({ subsystem: AiSubsystemNameEnum.CHAT }));
                })
            )
        );
    }

    interrupt(): void {
        void this.model.context?.stopCompletion();
    }
}

export const chatService = new ChatService();
