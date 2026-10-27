import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

export interface AnalyticsHistorySyncInterface {
    readonly sync: SyncEntityInterface;
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'type' | 'isActive' | 'integrationId'>;
}
