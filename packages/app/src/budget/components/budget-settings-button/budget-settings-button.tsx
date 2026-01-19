import { UserIconNameEnum } from '@budgie/contracts';
import { Link } from 'expo-router';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

export const BudgetSettingsButton = () => (
    <Link href="/budget/settings" asChild>
        <HapticPressable>
            <CircleIcon icon={UserIconNameEnum.Settings} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    </Link>
);
