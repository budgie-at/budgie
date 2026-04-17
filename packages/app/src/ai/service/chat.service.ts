import { GenerateOptionsInterface, stripThinkingTags } from '@budgie/ai';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { ChatSnapshotInterface } from '../interface/chat-snapshot.interface';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../util/ai-constants.util';
import { runCompletion } from '../util/run-completion.util';
import { aiLog } from '../utils/ai-log.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { ChatInvokerInterface } from '@budgie/ai';

class ChatService extends BaseLlamaSubsystemService implements AiSubsystemServiceInterface<ChatSnapshotInterface>, ChatInvokerInterface {
    private mutexChain: Promise<unknown> = Promise.resolve();

    constructor() {
        super('chat');
    }

    // eslint-disable-next-line max-statements -- Mutex-chained generation with error/success logging
    async generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        aiLog('chat:generate:start', { systemPromptLen: systemPrompt.length, userMessageLen: userMessage.length });
        if (!this.isReady || !isDefined(this.context)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Diagnostic tag payload, not user-facing
            aiLog('chat:generate:throw', { errorName: 'AiNotReadyError' });
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
            aiLog('chat:generate:complete', { durationMs: Date.now() - started, resultLen: stripped.length });

            return stripped;
        } catch (error: unknown) {
             
            aiLog('chat:generate:throw', { errorName: 'runtime', errorMessage: getErrorMessage(error) });
            throw error;
        }
    }

    interrupt(): void {
        aiLog('chat:interrupt');
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
