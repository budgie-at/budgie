import {
    Archive,
    ArrowRightLeft,
    Bitcoin,
    ChartNoAxesColumn,
    Check,
    ChevronLeft,
    ChevronRight,
    Coins,
    CreditCard,
    Database,
    DollarSign,
    EllipsisVertical,
    Globe,
    Home,
    Lock,
    MapPinIcon,
    Moon,
    Plus,
    Receipt,
    Settings,
    Shield,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Wallet,
    X
} from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = {
    Home,
    Receipt,
    Archive,
    ChartNoAxesColumn,
    Settings,
    TrendingDown,
    ArrowRightLeft,
    X,
    DollarSign,
    TrendingUp,
    Moon,
    Plus,
    Sparkles,
    Wallet,
    EllipsisVertical,
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Bitcoin,
    Check,
    MapPinIcon,
    Database,
    Shield,
    Lock,
    Globe,
    Coins
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
export type IconType = (typeof ICONS)[IconName];
