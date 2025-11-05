import {
    ArrowRightLeft,
    ChartNoAxesColumn,
    ChevronRight,
    CreditCard,
    Home,
    Plus,
    Receipt,
    Settings,
    TrendingDown,
    TrendingUp
} from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = {
    Home,
    Receipt,
    ChartNoAxesColumn,
    Settings,
    TrendingDown,
    ArrowRightLeft,
    TrendingUp,
    Plus,
    ChevronRight,
    CreditCard
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
