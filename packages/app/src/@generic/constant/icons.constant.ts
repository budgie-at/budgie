import { UserIconNameEnum } from '@budgie/contracts';
import * as icons from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = Object.fromEntries(Object.entries(LucideIcons).filter(([key]) => isCleanIconName(key))) as Record<
    IconName,
    LucideIcon
>;
export const ICONS = Object.fromEntries(Object.entries(icons).filter(([key]) => isCleanIconName(key))) as Record<
    UserIconNameEnum,
    LucideIcon
>;
