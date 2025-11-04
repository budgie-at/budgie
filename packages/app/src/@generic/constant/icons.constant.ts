import { ChartNoAxesColumn, Home, Plus, Receipt, Settings } from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = {
    Home,
    Receipt,
    ChartNoAxesColumn,
    Settings,
    Plus
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
