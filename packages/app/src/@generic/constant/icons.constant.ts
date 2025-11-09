import {
    ArrowRightLeft,
    ChartNoAxesColumn,
    ChevronRight,
    CreditCard,
    Database,
    Globe,
    Home,
    Lock,
    Moon,
    Plus,
    Receipt,
    Settings,
    Shield,
    TrendingDown,
    TrendingUp,
    Wallet
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
    Moon,
    Plus,
    Wallet,
    ChevronRight,
    Database,
    CreditCard,
    Shield,
    Lock,
    Globe
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
