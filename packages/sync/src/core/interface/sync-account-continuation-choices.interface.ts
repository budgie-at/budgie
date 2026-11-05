import type { SyncAccountContinuationRefusalEnum } from '../enum/sync-account-continuation-refusal.enum';

export interface SyncAccountContinuationChoicesInterface {
    readonly accountId: number;
    readonly refusals: ReadonlyMap<string, SyncAccountContinuationRefusalEnum>;
    readonly suggestedExternalId: string | null;
}
