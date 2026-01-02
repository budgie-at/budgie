import { BudgetEntityInterface, BudgetStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly onPress: EmptyFn;
    readonly onActivate: EmptyFn;
}

export const BudgetListItem = ({ budget, onPress, onActivate }: Props) => {
    const isActive = budget.status === BudgetStatusEnum.ACTIVE;

    return (
        <Card className="gap-2">
            <View className="flex-row items-center justify-between">
                <HapticPressable onPress={onPress} className="flex-row items-center gap-3 flex-1">
                    <Icon icon={UserIconNameEnum.Wallet} size={20} className="text-primary" />

                    <View className="flex-1">
                        <Text className="text-sm font-medium text-primary">{budget.title}</Text>
                        <Text className="text-xs text-secondary-foreground">
                            {isActive ? <Trans>Active</Trans> : <Trans>Inactive</Trans>}
                        </Text>
                    </View>
                </HapticPressable>

                {isActive ? (
                    <View className="bg-positive-background px-2 py-1 rounded-lg">
                        <Text className="text-xs font-medium text-positive-foreground">
                            <Trans>Active</Trans>
                        </Text>
                    </View>
                ) : (
                    <HapticPressable onPress={onActivate} className="bg-primary px-3 py-1.5 rounded-lg">
                        <Text className="text-xs font-medium text-primary-reverse">
                            <Trans>Activate</Trans>
                        </Text>
                    </HapticPressable>
                )}
            </View>

            {isDefined(budget.createdAt) && (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Created</Trans>: {budget.createdAt.toLocaleDateString()}
                </Text>
            )}
        </Card>
    );
};
