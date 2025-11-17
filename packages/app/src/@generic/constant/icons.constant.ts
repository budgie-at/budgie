import {
    ArrowRightLeft,
    ChartNoAxesColumn,
    Check,
    ChevronRight,
    CreditCard,
    Database,
    Globe,
    Home,
    Lock,
    MapPinIcon,
    Moon,
    Plus,
    DollarSign,
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
    MapPinIcon,
    Check,
    ArrowRightLeft,
    TrendingUp,
    Moon,
    Plus,
    DollarSign,
    Wallet,
    ChevronRight,
    Database,
    CreditCard,
    Shield,
    Lock,
    Globe
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
