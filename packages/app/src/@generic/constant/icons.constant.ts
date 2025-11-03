import { ChartNoAxesColumn, Home, Receipt, Settings } from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = {
    Home,
    Receipt,
    ChartNoAxesColumn,
    Settings
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
