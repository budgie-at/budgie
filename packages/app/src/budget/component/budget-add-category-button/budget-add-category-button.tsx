import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly budgetId: number;
}

export const BudgetAddCategoryButton = ({ budgetId }: Props) => (
    <Link href={`/budget/${budgetId}/add-allocation`} asChild>
        <HapticPressable className="flex-row items-center gap-1">
            <Icon icon={UserIconNameEnum.Plus} size={14} className="text-primary" />

            <Text className="text-xs text-primary">
                <Trans>Add</Trans>
            </Text>
        </HapticPressable>
    </Link>
);
