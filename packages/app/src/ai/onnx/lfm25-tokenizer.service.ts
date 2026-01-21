/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, lingui/no-unlocalized-strings */
import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { LFM25_CHAT_MARKERS, LFM25_MODEL_ID, LFM25_SPECIAL_TOKENS } from '../constant/onnx-llm.constant';
import { ChatMessageInterface } from '../interface/chat-message.interface';

type TokenizerInstance = PreTrainedTokenizer;

class Lfm25TokenizerService {
    private tokenizer: TokenizerInstance | null = null;
    private loadingPromise: Promise<void> | null = null;
    private loadError: string | null = null;

    get isLoaded(): boolean {
        return isDefined(this.tokenizer);
    }

    get error(): string | null {
        return this.loadError;
    }

    buildChatPrompt(messages: ChatMessageInterface[]): string {
        const { imStart, imEnd } = LFM25_CHAT_MARKERS;
        const parts = messages.map(msg => `${imStart}${msg.role}\n${msg.content}${imEnd}`);

        return `${parts.join('\n')}\n${imStart}assistant\n`;
    }

    getSpecialTokens(): typeof LFM25_SPECIAL_TOKENS {
        return LFM25_SPECIAL_TOKENS;
    }

    async load(): Promise<void> {
        if (isDefined(this.tokenizer)) {
            return;
        }

        if (isDefined(this.loadingPromise)) {
            await this.loadingPromise;

            return;
        }

        this.loadingPromise = this.loadTokenizer();

        await this.loadingPromise;
    }

    async encode(text: string): Promise<number[]> {
        const tokenizer = await this.getTokenizer();
        const result = tokenizer(text, { add_special_tokens: false });
        const inputIds = result.input_ids as { data: BigInt64Array };

        return Array.from(inputIds.data).map(Number);
    }

    async decode(tokens: number[]): Promise<string> {
        const tokenizer = await this.getTokenizer();

        return tokenizer.decode(tokens, { skip_special_tokens: true });
    }

    private async getTokenizer(): Promise<TokenizerInstance> {
        await this.ensureLoaded();

        if (!isDefined(this.tokenizer)) {
            throw new Error('Tokenizer not loaded');
        }

        return this.tokenizer;
    }

    private async loadTokenizer(): Promise<void> {
        try {
            this.tokenizer = await AutoTokenizer.from_pretrained(LFM25_MODEL_ID);
            this.loadError = null;
        } catch (err: unknown) {
            this.loadError = getErrorMessage(err);
            throw err;
        } finally {
            this.loadingPromise = null;
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (!isDefined(this.tokenizer)) {
            await this.load();
        }
    }
}

export const lfm25TokenizerService = new Lfm25TokenizerService();
