import { useEffect, useRef } from 'react';

import { useLlmContext } from '../context/llm.context';

interface UseLlmConfig {
    systemPrompt: string;
}

interface UseLlmReturn {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    sendMessage: (message: string) => Promise<string>;
    interrupt: () => void;
}

export const useLlm = (config: UseLlmConfig): UseLlmReturn => {
    const { llm } = useLlmContext();
    const systemPromptRef = useRef(config.systemPrompt);

    useEffect(() => {
        systemPromptRef.current = config.systemPrompt;
    }, [config.systemPrompt]);

    const sendMessage = async (message: string): Promise<string> => llm.generate(systemPromptRef.current, message);

    return {
        isReady: llm.isReady,
        isGenerating: llm.isGenerating,
        downloadProgress: llm.downloadProgress,
        sendMessage,
        interrupt: llm.interrupt
    };
};
