import { useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly budgetId: number;
}

export const BudgetAddCategoryButton = ({ budgetId }: Props) => {
    const { t } = useLingui();

    return (
        <Link href={`/budget/${budgetId}/add-allocation`} asChild>
            <HapticPressable className="flex-row items-center gap-1">
                <Icon icon="Plus" size={14} className="text-primary" />
                <Text className="text-xs text-primary">{t`Add`}</Text>
            </HapticPressable>
        </Link>
    );
};

