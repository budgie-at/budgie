import type { UserIconNameEnum } from '@budgie/contracts';
import type { SyncHistoryDepthEnum } from '@budgie/sync';

export interface SyncHistoryDepthOptionInterface {
    readonly depth: SyncHistoryDepthEnum;
    readonly icon: UserIconNameEnum;
}
