import { UserIconNameEnum } from '@budgie/contracts';
import * as icons from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

const isCleanIconName = (key: string): boolean =>
    // eslint-disable-next-line lingui/no-unlocalized-strings
    !key.endsWith('Icon') && !key.startsWith('Lucide');

export const ICONS = Object.fromEntries(Object.entries(icons).filter(([key]) => isCleanIconName(key))) as Record<
    UserIconNameEnum,
    LucideIcon
>;
