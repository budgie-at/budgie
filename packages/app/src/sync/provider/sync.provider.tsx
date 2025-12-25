import { useState } from 'react';

import { SyncContext as SyncContext1, SyncContextInterface } from '../context/sync.context';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';
import { SyncProgressInterface, emptySyncProgress } from '../interface/sync-progress.interface';

import type { PropsWithChildren } from 'react';

export const SyncProvider = ({ children }: PropsWithChildren) => {
    const [progress, setProgress] = useState<SyncProgressInterface>(emptySyncProgress);

    const startSync = () => {
        setProgress({
            status: SyncStatusEnum.SYNCING,
            step: SyncStepEnum.SYNCING_ACCOUNTS,
            currentAccount: 0,
            totalAccounts: 0,
            currentBatch: 0
        });
    };

    const updateProgress = (data: Partial<SyncProgressInterface>) => {
        setProgress(prev => ({ ...prev, ...data, status: SyncStatusEnum.SYNCING }));
    };

    const completeSync = () => {
        setProgress(prev => ({ ...prev, status: SyncStatusEnum.SUCCESS, step: SyncStepEnum.COMPLETED }));
        setTimeout(() => void setProgress(emptySyncProgress), 3000);
    };

    const failSync = (error: string) => {
        setProgress(prev => ({ ...prev, status: SyncStatusEnum.ERROR, step: SyncStepEnum.ERROR, error }));
        setTimeout(() => void setProgress(emptySyncProgress), 5000);
    };

    const resetSync = () => {
        setProgress(emptySyncProgress);
    };

    const isSyncing = progress.status === SyncStatusEnum.SYNCING;

    const value: SyncContextInterface = { progress, isSyncing, startSync, updateProgress, completeSync, failSync, resetSync };

    return <SyncContext1 value={value}>{children}</SyncContext1>;
};
