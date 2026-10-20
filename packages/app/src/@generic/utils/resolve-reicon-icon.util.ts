import { isReiconIcon } from '@budgie/contracts';

import { LEGACY_REICON_ICONS } from '../constant/legacy-reicon-icons.constant';

import type { ReiconIconNameEnum, UserIconNameEnum } from '@budgie/contracts';

export const resolveReiconIcon = (icon: UserIconNameEnum | ReiconIconNameEnum): ReiconIconNameEnum =>
    isReiconIcon(icon) ? icon : LEGACY_REICON_ICONS[icon];
