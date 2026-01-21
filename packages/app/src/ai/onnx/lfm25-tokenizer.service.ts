import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

type TokenizerInstance = PreTrainedTokenizer;

const MODEL_ID = 'LiquidAI/LFM2.5-1.2B-Instruct';

const IM_START = '<|im_start|>';
const IM_END = '<|im_end|>';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface Lfm25TokenizerInterface {
    tokenizer: TokenizerInstance | null;
    isLoaded: boolean;
    error: string | null;
    load: () => Promise<void>;
    encode: (text: string) => Promise<number[]>;
    decode: (tokens: number[]) => Promise<string>;
    buildChatPrompt: (messages: ChatMessage[]) => string;
    getSpecialTokens: () => { bosToken: number; eosToken: number; padToken: number };
}

let cachedTokenizer: TokenizerInstance | null = null;
let loadingPromise: Promise<void> | null = null;
let loadError: string | null = null;

const load = async (): Promise<void> => {
    if (isDefined(cachedTokenizer)) {
        return;
    }

    if (isDefined(loadingPromise)) {
        return loadingPromise;
    }

    loadingPromise = (async () => {
        try {
            cachedTokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
                progress_callback: (progress: { status: string; progress?: number }) => {
                    if (progress.status === 'progress' && isDefined(progress.progress)) {
                        console.log(`Tokenizer loading: ${Math.round(progress.progress)}%`);
                    }
                }
            });
            loadError = null;
        } catch (e: unknown) {
            loadError = getErrorMessage(e);
            throw e;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
};

const encode = async (text: string): Promise<number[]> => {
    if (!isDefined(cachedTokenizer)) {
        await load();
    }

    if (!isDefined(cachedTokenizer)) {
        throw new Error('Tokenizer not loaded');
    }

    const result = cachedTokenizer(text, { add_special_tokens: false });
    const inputIds = result.input_ids;

    return Array.from(inputIds.data as BigInt64Array).map(Number);
};

const decode = async (tokens: number[]): Promise<string> => {
    if (!isDefined(cachedTokenizer)) {
        await load();
    }

    if (!isDefined(cachedTokenizer)) {
        throw new Error('Tokenizer not loaded');
    }

    return cachedTokenizer.decode(tokens, { skip_special_tokens: true });
};

const buildChatPrompt = (messages: ChatMessage[]): string => {
    const parts = messages.map(msg => `${IM_START}${msg.role}\n${msg.content}${IM_END}`);

    return `${parts.join('\n')}\n${IM_START}assistant\n`;
};

const getSpecialTokens = (): { bosToken: number; eosToken: number; padToken: number } => ({
    bosToken: 0,
    eosToken: 2,
    padToken: 1
});

export const lfm25TokenizerService: Lfm25TokenizerInterface = {
    get tokenizer() {
        return cachedTokenizer;
    },
    get isLoaded() {
        return isDefined(cachedTokenizer);
    },
    get error() {
        return loadError;
    },
    load,
    encode,
    decode,
    buildChatPrompt,
    getSpecialTokens
};
