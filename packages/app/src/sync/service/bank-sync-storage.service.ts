import { BankProviderEnum } from '@budgie/bank-sync';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';
import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { SyncProgressInterface, emptySyncProgress } from '../interface/sync-progress.interface';

class BankSyncStorageService {
    getState(provider: BankProviderEnum): BankSyncStateInterface {
        const data = SecureStore.getItem(getBankSyncStorageKey(provider));

        if (!isDefined(data)) {
            return {
                provider,
                enabled: false,
                token: null,
                progress: emptySyncProgress,
                lastSyncAt: null,
                lastError: null
            };
        }

        return JSON.parse(data) as BankSyncStateInterface;
    }

    setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): void {
        SecureStore.setItem(getBankSyncStorageKey(provider), JSON.stringify({ ...this.getState(provider), ...state }));
    }

    updateProgress(provider: BankProviderEnum, progress: Partial<SyncProgressInterface>): void {
        this.setState(provider, { progress: { ...this.getState(provider).progress, ...progress } });
    }

    startSync(provider: BankProviderEnum, totalAccounts: number): void {
        this.setState(provider, {
            progress: {
                ...emptySyncProgress,
                status: SyncStatusEnum.SYNCING,
                step: SyncStepEnum.SYNCING_ACCOUNTS,
                totalAccounts
            },
            lastError: null
        });
    }

    completeSync(provider: BankProviderEnum, totalTransactions: number): void {
        this.setState(provider, {
            progress: {
                ...emptySyncProgress,
                status: SyncStatusEnum.SUCCESS,
                step: SyncStepEnum.COMPLETED,
                totalTransactions
            },
            lastSyncAt: new Date().toISOString(),
            lastError: null
        });
    }

    failSync(provider: BankProviderEnum, error: string): void {
        this.setState(provider, {
            progress: {
                ...this.getState(provider).progress,
                status: SyncStatusEnum.ERROR,
                step: SyncStepEnum.ERROR,
                error
            },
            lastError: error
        });
    }

    resetSync(provider: BankProviderEnum): void {
        this.setState(provider, { progress: emptySyncProgress, lastError: null });
    }

    isEnabled(provider: BankProviderEnum): boolean {
        return this.getState(provider).enabled;
    }

    setEnabled(provider: BankProviderEnum, enabled: boolean): void {
        this.setState(provider, { enabled });
    }

    getToken(provider: BankProviderEnum): string | null {
        return this.getState(provider).token;
    }

    setToken(provider: BankProviderEnum, token: string | null): void {
        this.setState(provider, { token });
    }

    hasToken(provider: BankProviderEnum): boolean {
        return isNotEmptyString(this.getToken(provider));
    }

    getAllActiveStates(): BankSyncStateInterface[] {
        const providers = Object.values(BankProviderEnum);

        return providers.map(provider => this.getState(provider)).filter(state => state.progress.status !== SyncStatusEnum.IDLE);
    }
}

export const bankSyncStorageService = new BankSyncStorageService();
