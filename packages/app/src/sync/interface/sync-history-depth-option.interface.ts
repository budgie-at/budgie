import type { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface SyncHistoryDepthOptionInterface {
    readonly depth: SyncHistoryDepthEnum;
    readonly icon: UserIconNameEnum;
}
