import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitCompactRow } from '../budget-category-limit-compact-row/budget-category-limit-compact-row';

export const BudgetInlineCategoryLimits = () => {
    const { control } = useFormContext<BudgetFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch({ control, name: 'categoryLimits' });
    const [openCategorySelector] = useCategorySelectorModal();

    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(id => id > 0);

    const handleAdd = async () => {
        const result = await openCategorySelector({
            excludeCategoryIds: selectedCategoryIds,
            description: t`Pick a category to set a limit`
        });

        if (isPositiveNumber(result)) {
            append({ categoryId: result, limitAmount: 0 });
        }
    };

    const handleAddPress = () => void handleAdd();

    return (
        <View className="gap-y-md">
            <View testID={BudgetSelector.SetupCategoryLimitsHeader} className="flex-row items-center justify-between">
                <Text className="text-primary text-lg font-semibold">
                    <Trans>Category limits</Trans>
                </Text>
                <HapticPressable testID={BudgetSelector.SetupCategoryLimitAddButton} onPress={handleAddPress}>
                    <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={26} iconSize={14} />
                </HapticPressable>
            </View>
            <Text className="text-secondary-foreground text-sm">
                <Trans>Optional per-category caps within this budget</Trans>
            </Text>
            {isEmptyArray(fields) ? (
                <Card variant="ghost" onPress={handleAddPress}>
                    <View className="items-center gap-y-md py-lg">
                        <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={40} iconSize={20} />
                        <Text className="text-primary text-md font-semibold">
                            <Trans>No category limits yet</Trans>
                        </Text>
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>Add a per-category cap</Trans>
                        </Text>
                    </View>
                </Card>
            ) : (
                fields.map((field, index) => <BudgetCategoryLimitCompactRow key={field.id} index={index} onRemove={remove} />)
            )}
        </View>
    );
};
