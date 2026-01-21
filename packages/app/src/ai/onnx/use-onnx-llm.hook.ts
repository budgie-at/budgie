import { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { lfm25InferenceService } from './lfm25-inference.service';
import { lfm25TokenizerService } from './lfm25-tokenizer.service';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface UseOnnxLlmConfig {
    modelPath: string;
    systemPrompt: string;
    initialMessageHistory?: ChatMessage[];
    maxNewTokens?: number;
    temperature?: number;
    topK?: number;
    repetitionPenalty?: number;
}

interface UseOnnxLlmReturn {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    error: string | null;
    messageHistory: ChatMessage[];
    sendMessage: (message: string) => Promise<string>;
    interrupt: () => void;
}

const DEFAULT_MAX_TOKENS = 256;
const DEFAULT_TEMPERATURE = 0.05;
const DEFAULT_TOP_K = 50;
const DEFAULT_REPETITION_PENALTY = 1.05;

export const useOnnxLlm = (config: UseOnnxLlmConfig): UseOnnxLlmReturn => {
    const [isReady, setIsReady] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [messageHistory, setMessageHistory] = useState<ChatMessage[]>(config.initialMessageHistory ?? []);

    const isLoadingRef = useRef(false);

    useEffect(() => {
        const loadModels = async (): Promise<void> => {
            if (isLoadingRef.current) {
                return;
            }

            isLoadingRef.current = true;

            try {
                setDownloadProgress(10);
                await lfm25TokenizerService.load();
                setDownloadProgress(30);

                await lfm25InferenceService.load(config.modelPath);
                setDownloadProgress(100);

                setIsReady(true);
                setError(null);
            } catch (e: unknown) {
                setError(getErrorMessage(e));
                setIsReady(false);
            } finally {
                isLoadingRef.current = false;
            }
        };

        loadModels().catch(console.error);
    }, [config.modelPath]);

    const sendMessage = async (message: string): Promise<string> => {
        if (!isReady) {
            throw new Error('Model not ready');
        }

        setIsGenerating(true);
        setError(null);

        try {
            const userMessage: ChatMessage = { role: 'user', content: message };
            const messagesWithSystem: ChatMessage[] = [{ role: 'system', content: config.systemPrompt }, ...messageHistory, userMessage];

            const prompt = lfm25TokenizerService.buildChatPrompt(messagesWithSystem);
            const inputIds = await lfm25TokenizerService.encode(prompt);

            const specialTokens = lfm25TokenizerService.getSpecialTokens();

            const generatedTokens = await lfm25InferenceService.generate(inputIds, {
                maxNewTokens: config.maxNewTokens ?? DEFAULT_MAX_TOKENS,
                temperature: config.temperature ?? DEFAULT_TEMPERATURE,
                topK: config.topK ?? DEFAULT_TOP_K,
                repetitionPenalty: config.repetitionPenalty ?? DEFAULT_REPETITION_PENALTY,
                eosTokenId: specialTokens.eosToken
            });

            const response = await lfm25TokenizerService.decode(generatedTokens);
            const cleanResponse = response.replace(/<\|im_end\|>/gu, '').trim();

            const assistantMessage: ChatMessage = { role: 'assistant', content: cleanResponse };

            setMessageHistory(prev => [...prev, userMessage, assistantMessage]);

            return cleanResponse;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setError(errorMessage);
            throw e;
        } finally {
            setIsGenerating(false);
        }
    };

    const interrupt = (): void => {
        lfm25InferenceService.interrupt();
        setIsGenerating(false);
    };

    return {
        isReady,
        isGenerating,
        downloadProgress,
        error,
        messageHistory,
        sendMessage,
        interrupt
    };
};

export type { ChatMessage };
