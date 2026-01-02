import { BudgetAllocationEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BudgetAllocationCard } from '../budget-allocation-card/budget-allocation-card';

interface AllocationInstanceData {
    readonly id: number;
    readonly budgetAllocationId: number;
    readonly planned: number;
    readonly actual: number;
    readonly rolloverIn: number;
    readonly adjustment: number;
}

interface Props {
    readonly allocationInstances: AllocationInstanceData[];
    readonly allocations: BudgetAllocationEntityInterface[];
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
    readonly onAddPress?: () => void;
    readonly onEditPress?: (allocation: BudgetAllocationEntityInterface) => void;
}

export const BudgetCategoriesList = (props: Props) => {
    const { allocationInstances, allocations, currencySymbol, formatAmount, onAddPress, onEditPress } = props;
    const { t } = useLingui();
    const hasAllocationInstances = isNotEmptyArray(allocationInstances);
    const hasAllocations = isNotEmptyArray(allocations);

    const renderAllocationInstances = () =>
        allocationInstances.map(ai => {
            const allocation = allocations.find(alloc => alloc.id === ai.budgetAllocationId);
            const categoryTitle = allocation?.categoryId ? t`Category ${allocation.categoryId}` : t`Uncategorized`;
            const categoryIcon = UserIconNameEnum.Wallet;
            const plannedTotal = ai.planned + ai.rolloverIn + ai.adjustment;

            return (
                <BudgetAllocationCard
                    key={ai.id}
                    categoryTitle={categoryTitle}
                    categoryIcon={categoryIcon}
                    planned={plannedTotal}
                    actual={ai.actual}
                    currencySymbol={currencySymbol}
                    formatAmount={formatAmount}
                />
            );
        });

    const renderAllocations = () =>
        allocations.map(allocation => {
            const categoryId = allocation.categoryId;
            const categoryTitle = isPositiveNumber(categoryId) ? t`Category ${categoryId}` : t`Uncategorized`;
            // eslint-disable-next-line no-undefined
            const handlePress = isDefined(onEditPress) ? () => void onEditPress(allocation) : undefined;

            return (
                <BudgetAllocationCard
                    key={allocation.id}
                    categoryTitle={categoryTitle}
                    categoryIcon={UserIconNameEnum.Wallet}
                    planned={allocation.amount}
                    actual={0}
                    currencySymbol={currencySymbol}
                    formatAmount={formatAmount}
                    onPress={handlePress}
                />
            );
        });

    const renderContent = () => {
        if (hasAllocationInstances) {
            return renderAllocationInstances();
        }

        if (hasAllocations) {
            return renderAllocations();
        }

        return (
            <View className="items-center py-8">
                <Icon icon={UserIconNameEnum.Layers} size={32} className="text-secondary-foreground mb-2" />
                <Text className="text-sm text-secondary-foreground">
                    <Trans>No categories added yet</Trans>
                </Text>
                {isDefined(onAddPress) && <Button variant="ghost" content={t`Add Category`} className="mt-2" onPress={onAddPress} />}
            </View>
        );
    };

    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between">
                <Text className="text-xs uppercase text-secondary-foreground">
                    <Trans>Categories</Trans>
                </Text>

                {isDefined(onAddPress) && (
                    <HapticPressable className="flex-row items-center gap-1" onPress={onAddPress}>
                        <Icon icon={UserIconNameEnum.Plus} size={14} className="text-primary" />
                        <Text className="text-xs text-primary">
                            <Trans>Add</Trans>
                        </Text>
                    </HapticPressable>
                )}
            </View>

            {renderContent()}
        </View>
    );
};
