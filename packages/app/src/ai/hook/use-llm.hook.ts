/* eslint-disable lingui/no-unlocalized-strings */
import { useEffect, useRef } from 'react';
import { Message } from 'react-native-executorch';

import { isDefined } from '@rnw-community/shared';

import { useLlmContext } from '../context/llm.context';

interface UseLlmConfig {
    systemPrompt: string;
    initialMessageHistory: Message[];
}

interface UseLlmReturn {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    sendMessage: (message: string) => Promise<string>;
    interrupt: () => Promise<void>;
}

const INTERRUPT_POLL_INTERVAL_MS = 50;

export const useLlm = (config: UseLlmConfig): UseLlmReturn => {
    const { llm } = useLlmContext();

    const resolveRef = useRef<((response: string) => void) | null>(null);
    const rejectRef = useRef<((error: Error) => void) | null>(null);

    useEffect(() => {
        if (!resolveRef.current) {
            return;
        }

        if (llm.isGenerating) {
            return;
        }

        const lastMessage = llm.messageHistory[llm.messageHistory.length - 1];

        if (llm.error && rejectRef.current) {
            const reject = rejectRef.current;
            resolveRef.current = null;
            rejectRef.current = null;
            reject(new Error(llm.error));
        } else if (isDefined(lastMessage) && lastMessage.role === 'assistant') {
            const resolve = resolveRef.current;
            resolveRef.current = null;
            rejectRef.current = null;
            resolve(lastMessage.content);
        }
    }, [llm.isGenerating, llm.messageHistory, llm.error]);

    const interrupt = () => {
        resolveRef.current = null;
        rejectRef.current = null;

        if (!llm.isReady || !llm.isGenerating) {
            return Promise.resolve();
        }

        llm.interrupt();
    };

    const sendMessage = async (message: string): Promise<string> => {
        if (!llm.isReady) {
            throw new Error('Model not ready');
        }

        await interrupt();

        llm.configure({ chatConfig: config });

        return new Promise((resolve, reject) => {
            resolveRef.current = resolve;
            rejectRef.current = reject;

            llm.sendMessage(message).catch((e: unknown) => {
                rejectRef.current?.(e instanceof Error ? e : new Error(String(e)));
                resolveRef.current = null;
                rejectRef.current = null;
            });
        });
    };

    return {
        isReady: llm.isReady,
        isGenerating: llm.isGenerating,
        downloadProgress: llm.downloadProgress,
        sendMessage,
        interrupt
    };
};
