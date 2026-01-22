/* eslint-disable no-console, lingui/no-unlocalized-strings, max-statements */
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
        console.log(`[DEBUG] LlmProvider.generate called, isReady: ${isReady}`);
        console.log(`[DEBUG] systemPrompt: ${systemPrompt.substring(0, 100)}...`);
        console.log(`[DEBUG] userMessage: ${userMessage}`);

        if (!isReady) {
            throw new Error('Model not ready');
        }

        setIsGenerating(true);
        setError(null);

        try {
            console.log('[DEBUG] Building chat prompt...');
            const prompt = lfm25TokenizerService.buildChatPrompt([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]);
            console.log(`[DEBUG] Prompt built, length: ${prompt.length}`);

            console.log('[DEBUG] Encoding prompt...');
            const inputIds = await lfm25TokenizerService.encode(prompt);
            console.log(`[DEBUG] Encoded, inputIds length: ${inputIds.length}`);

            const { eosToken } = lfm25TokenizerService.getSpecialTokens();
            console.log(`[DEBUG] EOS token: ${eosToken}`);

            console.log('[DEBUG] Starting inference...');
            const generatedTokens = await lfm25InferenceService.generate(inputIds, {
                ...LFM25_GENERATION_CONFIG,
                eosTokenId: eosToken
            });
            console.log(`[DEBUG] Inference complete, generated ${generatedTokens.length} tokens`);

            console.log('[DEBUG] Decoding tokens...');
            const decoded = await lfm25TokenizerService.decode(generatedTokens);
            console.log(`[DEBUG] Decoded: ${decoded}`);

            return decoded.replace(LFM25_CHAT_MARKERS.imEnd, '').trim();
        } catch (err: unknown) {
            console.log(`[DEBUG] LlmProvider.generate error: ${getErrorMessage(err)}`);
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
