import {
    ArrowRightLeft,
    Bitcoin,
    ChartNoAxesColumn,
    ChevronRight,
    CreditCard,
    Home,
    LucideIcon,
    Plus,
    Receipt,
    Settings,
    TrendingDown,
    TrendingUp,
    Wallet
} from 'lucide-react-native';

export const USER_ICONS = Object.entries({
    Home,
    Receipt,
    ChartNoAxesColumn,
    Settings,
    TrendingDown,
    ArrowRightLeft,
    TrendingUp,
    Plus,
    ChevronRight,
    CreditCard,
    Bitcoin,
    Wallet
}).map(([name, icon]) => ({ name, icon }));

export interface UserIcon {
    name: string;
    icon: LucideIcon;
}
