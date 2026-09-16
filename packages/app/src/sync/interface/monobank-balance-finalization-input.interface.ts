import type { SyncUpdateEntityInterface } from '@budgie/contracts';

export interface MonobankBalanceFinalizationInputInterface {
    readonly syncId: number;
    readonly accountId: number;
    readonly providerBalance: number;
    readonly progressUpdate: SyncUpdateEntityInterface;
    readonly isRunCurrent: () => boolean;
}
