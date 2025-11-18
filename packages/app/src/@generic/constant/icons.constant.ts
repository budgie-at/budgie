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
    Folder,
    Globe,
    Home,
    Lock,
    MapPinIcon,
    Moon,
    Plus,
    Receipt,
    Search,
    Settings,
    Shield,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Wallet,
    X
} from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';
import { USER_ICONS } from './user-icons.constant';

export const ICONS = {
    Home,
    Receipt,
    Search,
    Archive,
    ChartNoAxesColumn,
    Settings,
    Folder,
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
    Coins,
    ...USER_ICONS
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
export type IconType = (typeof ICONS)[IconName];
