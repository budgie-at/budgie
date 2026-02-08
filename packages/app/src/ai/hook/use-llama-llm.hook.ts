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

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf';
const MODEL_FILENAME = 'qwen2.5-1.5b-instruct-q8_0.gguf';
const STOP_TOKENS = ['<|im_end|>', '<|endoftext|>'];

const DEFAULT_MAX_TOKENS = 64;
const GPU_LAYERS = 99;
const CONTEXT_SIZE = 2048;
const PARALLEL_EMBEDDING_SLOTS = 8;
const GENERATION_CONFIG = { temperature: 0.1, top_k: 40, top_p: 0.95 };

const downloadModel = async (onProgress: (progress: number) => void): Promise<string> => {
    const destPath = `${Paths.document.uri}${MODEL_FILENAME}`;
    const destFile = new File(destPath);

    if (destFile.exists) {
        onProgress(1);

        return destPath;
    }

    const download = createDownloadResumable(MODEL_URL, destPath, {}, progress => {
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

// eslint-disable-next-line max-lines-per-function -- LLM hook requires model lifecycle, generation mutex, and state management
export const useLlamaLlm = (): LlmInterface => {
    const contextRef = useRef<LlamaContext | null>(null);
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

        const initializeModel = async (): Promise<void> => {
            try {
                const modelPath = await downloadModel(setDownloadProgress);

                if (!isMounted()) {
                    return;
                }

                setIsInitializing(true);
                contextRef.current = await initLlama({
                    model: modelPath,
                    n_ctx: CONTEXT_SIZE,
                    n_gpu_layers: GPU_LAYERS,
                    use_mlock: true,
                    embedding: true
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

        void initializeModel();

        return () => {
            isMountedRef.current = false;
            void releaseAllLlama();
        };
    }, []);

    const generateInternal = async (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> => {
        if (!isDefined(contextRef.current)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Model not loaded');
        }

        setIsGenerating(true);
        setError(null);

        try {
            return await runCompletion({
                context: contextRef.current,
                systemPrompt,
                userMessage,
                maxTokens: options?.maxNewTokens ?? DEFAULT_MAX_TOKENS,
                temperature: options?.temperature
            });
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
        if (!isDefined(contextRef.current)) {
            return [];
        }

        try {
            const result = await contextRef.current.embedding(text);

            return result.embedding;
        } catch {
            return [];
        }
    };

    // eslint-disable-next-line max-statements -- Parallel embedding with queue + await pattern
    const batchEmbedding = async (texts: string[]): Promise<Map<string, number[]>> => {
        const context = contextRef.current;

        if (!isDefined(context) || !isNotEmptyArray(texts)) {
            return new Map();
        }

        try {
            const parallelSize = Math.min(texts.length, PARALLEL_EMBEDDING_SLOTS);
            await context.parallel.enable({ n_parallel: parallelSize });

            const queued: Array<{ text: string; promise: Promise<{ embedding: number[] }> }> = [];
            /* eslint-disable no-await-in-loop -- Sequential queuing for parallel batch processing */
            for (const text of texts) {
                const { promise } = await context.parallel.embedding(text);
                queued.push({ text, promise });
            }
            /* eslint-enable no-await-in-loop */

            const results = new Map<string, number[]>();
            await Promise.all(
                queued.map(async ({ text, promise }) => {
                    const result = await promise;

                    if (isNotEmptyArray(result.embedding)) {
                        results.set(text, result.embedding);
                    }
                })
            );

            return results;
        } catch {
            return new Map();
        } finally {
            await context.parallel.disable().catch(emptyFn);
        }
    };

    const interrupt = (): void => {
        void contextRef.current?.stopCompletion();
        setIsGenerating(false);
    };

    return { isReady, isInitializing, isGenerating, downloadProgress, error, generate, embedding, batchEmbedding, interrupt };
};
