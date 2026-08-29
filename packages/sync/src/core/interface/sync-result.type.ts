import type { SyncErrorInterface } from './sync-error.interface';

export type SyncResultInterface<T> =
    | { readonly success: true; readonly data: T }
    | { readonly success: false; readonly error: SyncErrorInterface };
