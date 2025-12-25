import { createContext, use } from 'react';

import type { SyncProgressInterface } from '../interface/sync-progress.interface';

export interface SyncContextInterface {
    readonly progress: SyncProgressInterface;
    readonly isSyncing: boolean;
    readonly startSync: () => void;
    readonly updateProgress: (data: Partial<SyncProgressInterface>) => void;
    readonly completeSync: () => void;
    readonly failSync: (error: string) => void;
    readonly resetSync: () => void;
}

export const SyncContext = createContext<SyncContextInterface | null>(null);

export const useSyncContext = (): SyncContextInterface => {
    const context = use(SyncContext);
    if (!context) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('useSyncContext must be used within a SyncProvider');
    }

    return context;
};
