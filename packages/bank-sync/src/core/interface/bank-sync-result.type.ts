import type { BankSyncErrorInterface } from './bank-sync-error.interface';

export type BankSyncResultInterface<T> =
    | { readonly success: true; readonly data: T }
    | { readonly success: false; readonly error: BankSyncErrorInterface };
