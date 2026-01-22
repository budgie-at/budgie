import { useEffect, useRef } from 'react';

import { GenerateOptionsInterface, useLlmContext } from '../context/llm.context';

interface UseLlmConfig {
    systemPrompt: string;
}

interface UseLlmReturn {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    sendMessage: (message: string, options?: GenerateOptionsInterface) => Promise<string>;
    interrupt: () => void;
}

export const useLlm = (config: UseLlmConfig): UseLlmReturn => {
    const { llm } = useLlmContext();
    const systemPromptRef = useRef(config.systemPrompt);

    useEffect(() => {
        systemPromptRef.current = config.systemPrompt;
    }, [config.systemPrompt]);

    const sendMessage = async (message: string, options?: GenerateOptionsInterface): Promise<string> =>
        llm.generate(systemPromptRef.current, message, options);

    return {
        isReady: llm.isReady,
        isGenerating: llm.isGenerating,
        downloadProgress: llm.downloadProgress,
        sendMessage,
        interrupt: llm.interrupt
    };
};
