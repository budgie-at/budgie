import { UserIconNameEnum } from '@budgie/contracts';

import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';

import type { SyncHistoryDepthOptionInterface } from '../interface/sync-history-depth-option.interface';

export const SYNC_HISTORY_DEPTH_OPTIONS: readonly SyncHistoryDepthOptionInterface[] = [
    { depth: SyncHistoryDepthEnum.MONTH_1, icon: UserIconNameEnum.CalendarDays },
    { depth: SyncHistoryDepthEnum.MONTHS_3, icon: UserIconNameEnum.CalendarRange },
    { depth: SyncHistoryDepthEnum.MONTHS_6, icon: UserIconNameEnum.CalendarFold },
    { depth: SyncHistoryDepthEnum.YEAR_1, icon: UserIconNameEnum.CalendarClock },
    { depth: SyncHistoryDepthEnum.FULL, icon: UserIconNameEnum.Infinity },
    { depth: SyncHistoryDepthEnum.NEW_ONLY, icon: UserIconNameEnum.Clock }
];
