import { BankProviderEnum } from '@budgie/bank-sync';
import * as SecureStore from 'expo-secure-store';

import { isDefined } from '@rnw-community/shared';

import { getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';
import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { SyncProgressInterface, emptySyncProgress } from '../interface/sync-progress.interface';

class BankSyncStorageService {
    getState(provider: BankProviderEnum): BankSyncStateInterface {
        const data = SecureStore.getItem(getBankSyncStorageKey(provider));

        if (!isDefined(data)) {
            return this.createEmptyState(provider);
        }

        return JSON.parse(data) as BankSyncStateInterface;
    }

    setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): void {
        const currentState = this.getState(provider);
        const newState: BankSyncStateInterface = { ...currentState, ...state };

        SecureStore.setItem(getBankSyncStorageKey(provider), JSON.stringify(newState));
    }

    updateProgress(provider: BankProviderEnum, progress: Partial<SyncProgressInterface>): void {
        const currentState = this.getState(provider);
        const newProgress: SyncProgressInterface = { ...currentState.progress, ...progress };

        this.setState(provider, { progress: newProgress });
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
        const currentState = this.getState(provider);

        this.setState(provider, {
            progress: {
                ...currentState.progress,
                status: SyncStatusEnum.ERROR,
                step: SyncStepEnum.ERROR,
                error
            },
            lastError: error
        });
    }

    resetSync(provider: BankProviderEnum): void {
        this.setState(provider, {
            progress: emptySyncProgress,
            lastError: null
        });
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
        const token = this.getToken(provider);

        return isDefined(token) && token.length > 0;
    }

    getAllActiveStates(): BankSyncStateInterface[] {
        const providers = Object.values(BankProviderEnum);

        return providers.map(provider => this.getState(provider)).filter(state => state.progress.status !== SyncStatusEnum.IDLE);
    }

    private createEmptyState(provider: BankProviderEnum): BankSyncStateInterface {
        return {
            provider,
            enabled: false,
            token: null,
            progress: emptySyncProgress,
            lastSyncAt: null,
            lastError: null
        };
    }
}

export const bankSyncStorageService = new BankSyncStorageService();
