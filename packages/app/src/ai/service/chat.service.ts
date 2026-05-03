import { stripThinkingTags } from '@budgie/ai';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../util/ai-constants.util';
import { runCompletion } from '../util/run-completion.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { ChatInvokerInterface, GenerateOptionsInterface } from '@budgie/ai';

class ChatService
    extends BaseLlamaSubsystemService
    implements AiSubsystemServiceInterface<LlamaSubsystemSnapshotInterface>, ChatInvokerInterface
{
    private mutexChain: Promise<unknown> = Promise.resolve();

    constructor() {
        super(AiSubsystemNameEnum.CHAT);
    }

    @Log(
        (systemPrompt, userMessage) => `enter systemPromptLen=${systemPrompt.length} msgLen=${userMessage.length}`,
        (result, systemPrompt, userMessage) =>
            `done systemPromptLen=${systemPrompt.length} msgLen=${userMessage.length} resultLen=${result.length}`,
        (error, systemPrompt, userMessage) =>
            `throw systemPromptLen=${systemPrompt.length} msgLen=${userMessage.length} error=${getErrorMessage(error)}`
    )
    async generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError(AiSubsystemNameEnum.CHAT);
        }

        const runFn = async (): Promise<string> => {
            if (!isDefined(this.context)) {
                throw new AiNotReadyError(AiSubsystemNameEnum.CHAT);
            }

            return runCompletion(this.context, systemPrompt, userMessage, options);
        };
        const current = this.mutexChain.then(runFn, runFn);
        this.mutexChain = current.catch(emptyFn);
        const result = await current;

        return stripThinkingTags(result);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) interrupt(): void {
        void this.context?.stopCompletion();
    }

    protected getLlamaConfig() {
        return {
            modelUrl: CHAT_MODEL_URL,
            modelFilename: CHAT_MODEL_FILENAME,
            contextSize: CHAT_CONTEXT_SIZE,
            embedding: false
        };
    }
}

export const chatService = new ChatService();
