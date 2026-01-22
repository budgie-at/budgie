/* eslint-disable lingui/no-unlocalized-strings */
import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';
import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { LFM25_CHAT_MARKERS, LFM25_DOWNLOAD_CONFIG, LFM25_MODEL_ID, LFM25_SPECIAL_TOKENS } from '../constant/onnx-llm.constant';
import { ChatMessageInterface } from '../interface/chat-message.interface';

const TOKENIZER_FILES = ['tokenizer.json', 'tokenizer_config.json'] as const;
const HF_BASE_URL = 'https://huggingface.co';

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

        console.log('[DEBUG] Tokenizer type:', typeof tokenizer);
        console.log('[DEBUG] Tokenizer keys:', Object.keys(tokenizer));

        try {
            const encoded = tokenizer.encode(text, { add_special_tokens: false });
            console.log('[DEBUG] Encoded result type:', typeof encoded);
            console.log('[DEBUG] Encoded result:', JSON.stringify(encoded).substring(0, 200));

            if (Array.isArray(encoded)) {
                return encoded.map(Number);
            }

            const inputIds = encoded as unknown as { data: BigInt64Array };

            return Array.from(inputIds.data).map(Number);
        } catch (err) {
            console.log('[DEBUG] Encode error:', err);
            throw err;
        }
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
            const localPath = await this.ensureTokenizerFilesDownloaded();

            this.tokenizer = await AutoTokenizer.from_pretrained(localPath, { local_files_only: true });
            this.loadError = null;
        } catch (err: unknown) {
            this.loadError = getErrorMessage(err);
            throw err;
        } finally {
            this.loadingPromise = null;
        }
    }

    private async ensureTokenizerFilesDownloaded(): Promise<string> {
        const dir = new Directory(Paths.document, LFM25_DOWNLOAD_CONFIG.directory);

        if (!dir.exists) {
            dir.create();
        }

        const localPath = dir.uri;

        for (const filename of TOKENIZER_FILES) {
            const file = new File(dir, filename);

            if (!file.exists) {
                const url = `${HF_BASE_URL}/${LFM25_MODEL_ID}/resolve/main/${filename}`;
                const tempPath = `${FileSystemLegacy.cacheDirectory}${filename}`;

                const download = FileSystemLegacy.createDownloadResumable(url, tempPath, {
                    sessionType: FileSystemLegacy.FileSystemSessionType.BACKGROUND
                });

                await download.downloadAsync();
                await FileSystemLegacy.moveAsync({ from: tempPath, to: file.uri });
            }
        }

        return localPath;
    }

    private async ensureLoaded(): Promise<void> {
        if (!isDefined(this.tokenizer)) {
            await this.load();
        }
    }
}

export const lfm25TokenizerService = new Lfm25TokenizerService();
