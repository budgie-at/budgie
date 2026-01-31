import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { LlamaContext, initLlama, releaseAllLlama } from 'llama.rn';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { GenerateOptionsInterface, LlmInterface } from '../context/llm.context';

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf';
const MODEL_FILENAME = 'qwen2.5-1.5b-instruct-q8_0.gguf';
const STOP_TOKENS = ['<|im_end|>', '<|endoftext|>'];

const DEFAULT_MAX_TOKENS = 64;
const GPU_LAYERS = 99;
const CONTEXT_SIZE = 2048;
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

const runCompletion = async (context: LlamaContext, systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> => {
    const result = await context.completion({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        n_predict: maxTokens,
        stop: STOP_TOKENS,
        ...GENERATION_CONFIG
    });

    return result.text.trim();
};

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
                    use_mlock: true
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
            return await runCompletion(contextRef.current, systemPrompt, userMessage, options?.maxNewTokens ?? DEFAULT_MAX_TOKENS);
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

    const interrupt = (): void => {
        void contextRef.current?.stopCompletion();
        setIsGenerating(false);
    };

    return { isReady, isInitializing, isGenerating, downloadProgress, error, generate, interrupt };
};
