import { BankProviderEnum } from '@budgie/bank-sync';

const BANK_SYNC_STORAGE_KEY = 'bank-sync';

export const getBankSyncStorageKey = (provider: BankProviderEnum): string => `${BANK_SYNC_STORAGE_KEY}.${provider}`;
