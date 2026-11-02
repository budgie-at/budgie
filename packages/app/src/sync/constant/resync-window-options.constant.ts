import { UserIconNameEnum } from '@budgie/contracts';

import type { ResyncWindowOptionInterface } from '../interface/resync-window-option.interface';

export const RESYNC_WINDOW_OPTIONS: readonly ResyncWindowOptionInterface[] = [
    { sinceDays: 7, icon: UserIconNameEnum.Clock },
    { sinceDays: 30, icon: UserIconNameEnum.CalendarDays },
    { sinceDays: 90, icon: UserIconNameEnum.CalendarRange },
    { sinceDays: null, icon: UserIconNameEnum.History }
];
