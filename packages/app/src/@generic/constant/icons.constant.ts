import {
    ArrowRightLeft,
    ChartNoAxesColumn,
    Check,
    ChevronRight,
    CreditCard,
    Database,
    DollarSign,
    Globe,
    Home,
    Lock,
    MapPinIcon,
    Moon,
    Sparkles,
    Plus,
    Receipt,
    Settings,
    EllipsisVertical,
    Shield,
    TrendingDown,
    X,
    ChevronLeft,
    TrendingUp,
    Wallet
} from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

export const ICONS = {
    Home,
    Receipt,
    Sparkles,
    ChartNoAxesColumn,
    ChevronLeft,
    Settings,
    TrendingDown,
    EllipsisVertical,
    MapPinIcon,
    Check,
    ArrowRightLeft,
    TrendingUp,
    Moon,
    Plus,
    DollarSign,
    Wallet,
    ChevronRight,
    X,
    Database,
    CreditCard,
    Shield,
    Lock,
    Globe
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
