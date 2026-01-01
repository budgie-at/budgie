/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BudgetEntityInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { budgetService } from '../../service/budget.service';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetSettingsCard = ({ budget }: Props) => {
    const { t } = useLingui();
    const { startDay } = budget;

    const handleNavigate = useCallback(() => {
        router.push(`/budget/${budget.id}`);
    }, [budget.id]);

    const handleClone = useCallback(() => {
        const defaultTitle = `${budget.title} (Copy)`;
        Alert.prompt(
            t`Clone Budget`,
            t`Enter a name for the new budget`,
            [
                { text: t`Cancel`, style: 'cancel' },
                {
                    text: t`Clone`,
                    onPress: (newTitle?: string) => {
                        if (newTitle?.trim()) {
                            void budgetService.cloneBudget(budget.id, newTitle.trim()).then(cloned => {
                                router.push(`/budget/${cloned.id}`);

                                return cloned;
                            });
                        }
                    }
                }
            ],
            'plain-text',
            defaultTitle
        );
    }, [budget.id, budget.title, t]);

    const getPeriodLabel = () => {
        if (budget.period === BudgetPeriodEnum.MONTHLY) {
            return t`Monthly`;
        }

        return t`Weekly`;
    };

    return (
        <Card className="gap-3">
            <HapticPressable onPress={handleNavigate}>
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon size={36} iconSize={20} icon="Wallet" variant="ghost" border={false} />
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-primary">{budget.title}</Text>
                        <Text className="text-xs text-secondary-foreground">
                            {getPeriodLabel()} · {t`Day ${startDay}`}
                        </Text>
                    </View>
                </View>
            </HapticPressable>
            <View className="flex-row gap-2">
                <HapticPressable
                    className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg bg-secondary-background"
                    onPress={handleNavigate}
                >
                    <Icon icon="Settings" size={14} className="text-primary" />
                    <Text className="text-xs text-primary">{t`Edit`}</Text>
                </HapticPressable>
                <HapticPressable
                    className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg bg-secondary-background"
                    onPress={handleClone}
                >
                    <Icon icon="Layers" size={14} className="text-primary" />
                    <Text className="text-xs text-primary">{t`Clone`}</Text>
                </HapticPressable>
            </View>
        </Card>
    );
};

