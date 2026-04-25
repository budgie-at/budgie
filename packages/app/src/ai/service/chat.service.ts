import { stripThinkingTags } from '@budgie/ai';
import { Log } from '@budgie/contracts';

import { emptyFn, isDefined } from '@rnw-community/shared';

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
        super('chat');
    }
    @Log(
        (_systemPrompt: string, userMessage: string) => `generate:enter msgLen=${userMessage.length}`,
        (result: string) => `generate:done resultLen=${result.length}`,
        (error, _systemPrompt: string, userMessage: string) => `generate:throw msgLen=${userMessage.length} error=${String(error)}`
    ) // eslint-disable-next-line max-statements -- Mutex-chained generation
    async generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError('chat');
        }

        const runFn = async (): Promise<string> => {
            if (!isDefined(this.context)) {
                throw new AiNotReadyError('chat');
            }

            return runCompletion(this.context, systemPrompt, userMessage, options);
        };
        const current = this.mutexChain.then(runFn, runFn);
        this.mutexChain = current.catch(emptyFn);
        const result = await current;

        return stripThinkingTags(result);
    }
    @Log(() => 'interrupt:enter', () => 'interrupt:done', error => `interrupt:throw error=${String(error)}`) interrupt(): void {
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
