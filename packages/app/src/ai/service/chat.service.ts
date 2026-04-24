import { stripThinkingTags } from '@budgie/ai';
import { Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../util/ai-constants.util';
import { runCompletion } from '../util/run-completion.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { ChatInvokerInterface, GenerateOptionsInterface } from '@budgie/ai';

const logger = getLogger(LoggerNamespaceEnum.CHAT);

class ChatService
    extends BaseLlamaSubsystemService
    implements AiSubsystemServiceInterface<LlamaSubsystemSnapshotInterface>, ChatInvokerInterface
{
    private mutexChain: Promise<unknown> = Promise.resolve();

    constructor() {
        super('chat');
    }

     
    @Log(LoggerNamespaceEnum.CHAT, 'chat:generate:start')
    // eslint-disable-next-line max-statements -- Mutex-chained generation with error/success logging
    async generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Diagnostic tag payload, not user-facing
            logger.log('chat:generate:throw', { errorName: 'AiNotReadyError' });
            throw new AiNotReadyError('chat');
        }

        const runFn = async (): Promise<string> => {
            if (!isDefined(this.context)) {
                throw new AiNotReadyError('chat');
            }

            return runCompletion(this.context, systemPrompt, userMessage, options);
        };
        const started = Date.now();
        const current = this.mutexChain.then(runFn, runFn);
        this.mutexChain = current.catch(emptyFn);
        try {
            const stripped = stripThinkingTags(await current);
            logger.log('chat:generate:complete', { durationMs: Date.now() - started, resultLen: stripped.length });

            return stripped;
        } catch (error: unknown) {
            logger.log('chat:generate:throw', { errorName: 'runtime', errorMessage: getErrorMessage(error) });
            throw error;
        }
    }

    @Log(LoggerNamespaceEnum.CHAT, 'chat:interrupt')
    interrupt(): void {
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
