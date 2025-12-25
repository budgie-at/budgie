/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';

import type { SyncProgressInterface } from '../interface/sync-progress.interface';
import type { PropsWithChildren } from 'react';

interface SyncProgressDataInterface {
    readonly step: SyncStepEnum;
    readonly currentAccount?: number;
    readonly totalAccounts?: number;
    readonly currentBatch?: number;
}

interface SyncContextInterface {
    readonly progress: SyncProgressInterface;
    readonly isSyncing: boolean;
    readonly startSync: () => void;
    readonly updateProgress: (data: SyncProgressDataInterface) => void;
    readonly completeSync: () => void;
    readonly failSync: (error: string) => void;
    readonly resetSync: () => void;
}

const DEFAULT_PROGRESS: SyncProgressInterface = {
    status: SyncStatusEnum.IDLE,
    step: SyncStepEnum.IDLE,
    currentAccount: 0,
    totalAccounts: 0,
    currentBatch: 0
};

const SyncContext = createContext<SyncContextInterface | null>(null);

export const SyncProvider = ({ children }: PropsWithChildren) => {
    const [progress, setProgress] = useState<SyncProgressInterface>(DEFAULT_PROGRESS);

    const startSync = useCallback(() => {
        setProgress({
            status: SyncStatusEnum.SYNCING,
            step: SyncStepEnum.SYNCING_ACCOUNTS,
            currentAccount: 0,
            totalAccounts: 0,
            currentBatch: 0
        });
    }, []);

    const updateProgress = useCallback((data: SyncProgressDataInterface) => {
        setProgress(prev => ({
            ...prev,
            status: SyncStatusEnum.SYNCING,
            step: data.step,
            currentAccount: data.currentAccount ?? prev.currentAccount,
            totalAccounts: data.totalAccounts ?? prev.totalAccounts,
            currentBatch: data.currentBatch ?? prev.currentBatch
        }));
    }, []);

    const completeSync = useCallback(() => {
        setProgress(prev => ({ ...prev, status: SyncStatusEnum.SUCCESS, step: SyncStepEnum.COMPLETED }));
        setTimeout(() => {
            setProgress(DEFAULT_PROGRESS);
        }, 3000);
    }, []);

    const failSync = useCallback((error: string) => {
        setProgress(prev => ({ ...prev, status: SyncStatusEnum.ERROR, step: SyncStepEnum.ERROR, error }));
        setTimeout(() => {
            setProgress(DEFAULT_PROGRESS);
        }, 5000);
    }, []);

    const resetSync = useCallback(() => {
        setProgress(DEFAULT_PROGRESS);
    }, []);

    const isSyncing = progress.status === SyncStatusEnum.SYNCING;

    const value = useMemo(
        () => ({ progress, isSyncing, startSync, updateProgress, completeSync, failSync, resetSync }),
        [progress, isSyncing, startSync, updateProgress, completeSync, failSync, resetSync]
    );

    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSyncContext = (): SyncContextInterface => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSyncContext must be used within a SyncProvider');
    }

    return context;
};
