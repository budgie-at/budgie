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

import { typedObjectEntries } from '../utils/typed-object-entries.util';

import type { UserIconNameEnum } from '@budgie/contracts';

const icons: Record<UserIconNameEnum, LucideIcon> = {
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
};

export const USER_ICONS: UserIcon[] = typedObjectEntries(icons).map(([name, icon]) => ({ name, icon }));

export interface UserIcon {
    name: UserIconNameEnum;
    icon: LucideIcon;
}
