import { UserIconNameEnum } from '@budgie/contracts';

import type { ResyncWindowOptionInterface } from '../interface/resync-window-option.interface';

export const RESYNC_WINDOW_OPTIONS: readonly ResyncWindowOptionInterface[] = [
    { sinceDays: 7, icon: UserIconNameEnum.Clock, isDestructive: false },
    { sinceDays: 30, icon: UserIconNameEnum.CalendarDays, isDestructive: false },
    { sinceDays: 90, icon: UserIconNameEnum.CalendarRange, isDestructive: false },
    { sinceDays: null, icon: UserIconNameEnum.Triangle, isDestructive: true }
];
