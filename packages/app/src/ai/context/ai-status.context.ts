/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

export interface AiStatusContextInterface {
    readonly statusLabel: string;
    readonly brainProgress: number;
    readonly isRunning: boolean;
    readonly isLlmReady: boolean;
    readonly start: () => Promise<void>;
    readonly startFresh: () => Promise<void>;
}

export const AiStatusContext = createContext<AiStatusContextInterface | null>(null);

export const useAiStatusContext = (): AiStatusContextInterface => {
    const context = use(AiStatusContext);

    if (context === null) {
        throw new Error('useAiStatusContext must be used within AiStatusProvider');
    }

    return context;
};
