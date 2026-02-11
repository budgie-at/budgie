import { GenerateOptionsInterface, LlmInterface } from '@budgie/ai';
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { LlamaContext, initLlama, releaseAllLlama } from 'llama.rn';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

interface RunCompletionParams {
    context: LlamaContext;
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature?: number;
}

const CHAT_MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf';
const CHAT_MODEL_FILENAME = 'qwen2.5-1.5b-instruct-q8_0.gguf';
const CHAT_CONTEXT_SIZE = 2048;

const EMBEDDING_MODEL_URL = 'https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe-GGUF/resolve/main/nomic-embed-text-v2-moe.Q8_0.gguf';
const EMBEDDING_MODEL_FILENAME = 'nomic-embed-text-v2-moe.Q8_0.gguf';
const EMBEDDING_CONTEXT_SIZE = 512;

const STOP_TOKENS = ['<|im_end|>', '<|endoftext|>'];

const DEFAULT_MAX_TOKENS = 64;
const GPU_LAYERS = 99;
const GENERATION_CONFIG = { temperature: 0.1, top_k: 40, top_p: 0.95 };

const CHAT_MODEL_SIZE_MB = 1620;
const EMBEDDING_MODEL_SIZE_MB = 488;
const TOTAL_MODEL_SIZE_MB = CHAT_MODEL_SIZE_MB + EMBEDDING_MODEL_SIZE_MB;
const CHAT_DOWNLOAD_WEIGHT = CHAT_MODEL_SIZE_MB / TOTAL_MODEL_SIZE_MB;
const EMBEDDING_DOWNLOAD_WEIGHT = EMBEDDING_MODEL_SIZE_MB / TOTAL_MODEL_SIZE_MB;

const downloadModel = async (url: string, filename: string, onProgress: (progress: number) => void): Promise<string> => {
    const destPath = `${Paths.document.uri}${filename}`;
    const destFile = new File(destPath);

    if (destFile.exists) {
        onProgress(1);

        return destPath;
    }

    const download = createDownloadResumable(url, destPath, {}, progress => {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    });

    const result = await download.downloadAsync();

    if (!isDefined(result?.uri)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('Model download failed');
    }

    return result.uri;
};

const runCompletion = async (params: RunCompletionParams): Promise<string> => {
    const result = await params.context.completion({
        messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userMessage }
        ],
        n_predict: params.maxTokens,
        stop: STOP_TOKENS,
        ...GENERATION_CONFIG,
        ...(isDefined(params.temperature) ? { temperature: params.temperature } : {})
    });

    return result.text.trim();
};

// eslint-disable-next-line max-lines-per-function, max-statements -- LLM hook requires dual model lifecycle, generation mutex, and state management
export const useLlamaLlm = (): LlmInterface => {
    const chatContextRef = useRef<LlamaContext | null>(null);
    const embeddingContextRef = useRef<LlamaContext | null>(null);
    const isLoadingRef = useRef(false);
    const isMountedRef = useRef(true);
    const generateMutexRef = useRef<Promise<unknown>>(Promise.resolve());

    const [isReady, setIsReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoadingRef.current) {
            return emptyFn;
        }
        isLoadingRef.current = true;
        isMountedRef.current = true;

        const isMounted = (): boolean => isMountedRef.current;

        let chatDownloadProgress = 0;
        let embeddingDownloadProgress = 0;

        const updateCombinedProgress = (): void => {
            const combined = chatDownloadProgress * CHAT_DOWNLOAD_WEIGHT + embeddingDownloadProgress * EMBEDDING_DOWNLOAD_WEIGHT;
            setDownloadProgress(combined);
        };

        const handleChatDownloadProgress = (progress: number): void => {
            chatDownloadProgress = progress;
            updateCombinedProgress();
        };

        const handleEmbeddingDownloadProgress = (progress: number): void => {
            embeddingDownloadProgress = progress;
            updateCombinedProgress();
        };

        // eslint-disable-next-line max-statements -- Dual model initialization requires sequential context setup with mount checks
        const initializeModels = async (): Promise<void> => {
            try {
                const [chatModelPath, embeddingModelPath] = await Promise.all([
                    downloadModel(CHAT_MODEL_URL, CHAT_MODEL_FILENAME, handleChatDownloadProgress),
                    downloadModel(EMBEDDING_MODEL_URL, EMBEDDING_MODEL_FILENAME, handleEmbeddingDownloadProgress)
                ]);

                if (!isMounted()) {
                    return;
                }

                setIsInitializing(true);

                chatContextRef.current = await initLlama({
                    model: chatModelPath,
                    n_ctx: CHAT_CONTEXT_SIZE,
                    n_gpu_layers: GPU_LAYERS,
                    use_mlock: true,
                    embedding: false
                });

                if (!isMounted()) {
                    void releaseAllLlama();

                    return;
                }

                embeddingContextRef.current = await initLlama({
                    model: embeddingModelPath,
                    n_ctx: EMBEDDING_CONTEXT_SIZE,
                    n_gpu_layers: GPU_LAYERS,
                    use_mlock: true,
                    embedding: true,
                    pooling_type: 'mean'
                });

                if (!isMounted()) {
                    void releaseAllLlama();

                    return;
                }

                setIsReady(true);
            } catch (err: unknown) {
                if (isMounted()) {
                    setError(getErrorMessage(err));
                }
            } finally {
                if (isMounted()) {
                    setIsInitializing(false);
                }
                isLoadingRef.current = false;
            }
        };

        void initializeModels();

        return () => {
            isMountedRef.current = false;
            void releaseAllLlama();
        };
    }, []);

    const generateInternal = async (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> => {
        if (!isDefined(chatContextRef.current)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Model not loaded');
        }

        setIsGenerating(true);
        setError(null);

        try {
            const result = await runCompletion({
                context: chatContextRef.current,
                systemPrompt,
                userMessage,
                maxTokens: options?.maxNewTokens ?? DEFAULT_MAX_TOKENS,
                temperature: options?.temperature
            });

            return result;
        } catch (err: unknown) {
            setError(getErrorMessage(err));
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };

    const generate = async (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> => {
        if (!isReady) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Model not ready');
        }

        const previousMutex = generateMutexRef.current;
        const currentGeneration = previousMutex.then(
            async () => generateInternal(systemPrompt, userMessage, options),
            async () => generateInternal(systemPrompt, userMessage, options)
        );

        generateMutexRef.current = currentGeneration.catch(emptyFn);

        return currentGeneration;
    };

    const embedding = async (text: string): Promise<number[]> => {
        if (!isDefined(embeddingContextRef.current)) {
            return [];
        }

        try {
            const result = await embeddingContextRef.current.embedding(text);

            return result.embedding;
        } catch {
            return [];
        }
    };

    const batchEmbedding = async (texts: string[]): Promise<Map<string, number[]>> => {
        const context = embeddingContextRef.current;

        if (!isDefined(context) || !isNotEmptyArray(texts)) {
            return new Map();
        }

        const results = new Map<string, number[]>();

        /* eslint-disable no-await-in-loop -- Sequential batch embedding to avoid duplicate embeddings from parallel calls */
        for (const text of texts) {
            try {
                const result = await context.embedding(text);

                if (isNotEmptyArray(result.embedding)) {
                    results.set(text, result.embedding);
                }
            } catch {
                // Silently skip failed items
            }
        }
        /* eslint-enable no-await-in-loop */

        return results;
    };

    const interrupt = (): void => {
        void chatContextRef.current?.stopCompletion();
        setIsGenerating(false);
    };

    return { isReady, isInitializing, isGenerating, downloadProgress, error, generate, embedding, batchEmbedding, interrupt };
};
