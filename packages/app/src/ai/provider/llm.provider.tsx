/* eslint-disable no-console, lingui/no-unlocalized-strings */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { WHISPER_BASE, useSpeechToText } from 'react-native-executorch';

import { getErrorMessage } from '@rnw-community/shared';

import { LFM25_CHAT_MARKERS, LFM25_GENERATION_CONFIG } from '../constant/onnx-llm.constant';
import { LlmContext, LlmInterface } from '../context/llm.context';
import { lfm25InferenceService } from '../onnx/lfm25-inference.service';
import { lfm25ModelDownloadService } from '../onnx/lfm25-model-download.service';
import { lfm25TokenizerService } from '../onnx/lfm25-tokenizer.service';

interface Props {
    readonly children: ReactNode;
}

const useOnnxLlm = (): LlmInterface => {
    const [isReady, setIsReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const isLoadingRef = useRef(false);

    useEffect(() => {
        if (isLoadingRef.current) {
            return;
        }

        isLoadingRef.current = true;

        const loadModels = async (): Promise<void> => {
            try {
                const isAlreadyDownloaded = lfm25ModelDownloadService.isModelDownloaded();

                if (isAlreadyDownloaded) {
                    setIsInitializing(true);
                    setDownloadProgress(1);
                } else {
                    setDownloadProgress(0);
                }

                await lfm25TokenizerService.load();

                const modelPath = await lfm25ModelDownloadService.getModelPath(progress => {
                    if (!isAlreadyDownloaded) {
                        setDownloadProgress(progress);
                    }
                });

                await lfm25InferenceService.load(modelPath);

                setIsReady(true);
                setIsInitializing(false);
                setError(null);
            } catch (err: unknown) {
                setError(getErrorMessage(err));
                setIsReady(false);
                setIsInitializing(false);
            } finally {
                isLoadingRef.current = false;
            }
        };

        loadModels().catch(console.error);
    }, []);

    const generate = async (systemPrompt: string, userMessage: string): Promise<string> => {
        if (!isReady) {
            throw new Error('Model not ready');
        }

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = lfm25TokenizerService.buildChatPrompt([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]);
            const inputIds = await lfm25TokenizerService.encode(prompt);
            const { eosToken } = lfm25TokenizerService.getSpecialTokens();

            const generatedTokens = await lfm25InferenceService.generate(inputIds, {
                ...LFM25_GENERATION_CONFIG,
                eosTokenId: eosToken
            });

            const decoded = await lfm25TokenizerService.decode(generatedTokens);

            return decoded.replace(LFM25_CHAT_MARKERS.imEnd, '').trim();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
            throw err;
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
        isInitializing,
        isGenerating,
        downloadProgress,
        error,
        generate,
        interrupt
    };
};

export const LlmProvider = ({ children }: Props) => {
    const llm = useOnnxLlm();
    const stt = useSpeechToText({ model: WHISPER_BASE });

    const value = { isAvailable: true, llm, stt };

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
