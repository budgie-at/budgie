import { BankProviderEnum } from '@budgie/bank-sync';
import * as SecureStore from 'expo-secure-store';

import { isDefined } from '@rnw-community/shared';

import { getBankSyncEnabledKey, getBankSyncStorageKey } from '../constant/bank-sync-storage-key.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';
import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { SyncProgressInterface, emptySyncProgress } from '../interface/sync-progress.interface';

class BankSyncStorageService {
    async getState(provider: BankProviderEnum): Promise<BankSyncStateInterface> {
        const key = getBankSyncStorageKey(provider);
        const data = SecureStore.getItem(key);

        if (!isDefined(data)) {
            return this.createEmptyState(provider);
        }

        return JSON.parse(data) as BankSyncStateInterface;
    }

    async setState(provider: BankProviderEnum, state: Partial<BankSyncStateInterface>): Promise<void> {
        const key = getBankSyncStorageKey(provider);
        const currentState = await this.getState(provider);
        const newState: BankSyncStateInterface = { ...currentState, ...state };

        SecureStore.setItem(key, JSON.stringify(newState));
    }

    async updateProgress(provider: BankProviderEnum, progress: Partial<SyncProgressInterface>): Promise<void> {
        const currentState = await this.getState(provider);
        const newProgress: SyncProgressInterface = { ...currentState.progress, ...progress };

        await this.setState(provider, { progress: newProgress });
    }

    async startSync(provider: BankProviderEnum, totalAccounts: number): Promise<void> {
        await this.setState(provider, {
            progress: {
                ...emptySyncProgress,
                status: SyncStatusEnum.SYNCING,
                step: SyncStepEnum.SYNCING_ACCOUNTS,
                totalAccounts
            },
            lastError: null
        });
    }

    async completeSync(provider: BankProviderEnum, totalTransactions: number): Promise<void> {
        await this.setState(provider, {
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

    async failSync(provider: BankProviderEnum, error: string): Promise<void> {
        const currentState = await this.getState(provider);

        await this.setState(provider, {
            progress: {
                ...currentState.progress,
                status: SyncStatusEnum.ERROR,
                step: SyncStepEnum.ERROR,
                error
            },
            lastError: error
        });
    }

    async resetSync(provider: BankProviderEnum): Promise<void> {
        await this.setState(provider, {
            progress: emptySyncProgress,
            lastError: null
        });
    }

    async isEnabled(provider: BankProviderEnum): Promise<boolean> {
        const key = getBankSyncEnabledKey(provider);
        const value = SecureStore.getItem(key);

        return value === 'true';
    }

    async setEnabled(provider: BankProviderEnum, enabled: boolean): Promise<void> {
        const key = getBankSyncEnabledKey(provider);

        SecureStore.setItem(key, enabled ? 'true' : 'false');
    }

    async getAllStates(): Promise<BankSyncStateInterface[]> {
        const providers = Object.values(BankProviderEnum);
        const states = await Promise.all(providers.map(provider => this.getState(provider)));

        return states.filter(state => state.progress.status !== SyncStatusEnum.IDLE);
    }

    private createEmptyState(provider: BankProviderEnum): BankSyncStateInterface {
        return {
            provider,
            progress: emptySyncProgress,
            lastSyncAt: null,
            lastError: null
        };
    }
}

export const bankSyncStorageService = new BankSyncStorageService();
