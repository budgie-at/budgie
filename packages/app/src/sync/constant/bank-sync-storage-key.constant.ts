import { BankProviderEnum } from '@budgie/bank-sync';

const BANK_SYNC_STORAGE_KEY = 'bank-sync-state';

export const getBankSyncStorageKey = (provider: BankProviderEnum): string => `${BANK_SYNC_STORAGE_KEY}.${provider}`;
export const getBankSyncEnabledKey = (provider: BankProviderEnum): string => `${BANK_SYNC_STORAGE_KEY}.${provider}.enabled`;
