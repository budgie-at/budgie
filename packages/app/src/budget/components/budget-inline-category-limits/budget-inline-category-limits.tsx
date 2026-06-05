import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitCompactRow } from '../budget-category-limit-compact-row/budget-category-limit-compact-row';
import { BudgetCategoryLimitsEmptyState } from '../budget-category-limits-empty-state/budget-category-limits-empty-state';

const ADD_BUTTON_STYLE = { width: 26, height: 26 } as const;

export const BudgetInlineCategoryLimits = () => {
    const { control } = useFormContext<BudgetFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch({ control, name: 'categoryLimits' });
    const [openCategorySelector] = useCategorySelectorModal();

    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(id => id > 0);
    const isCategoryLimitsEmpty = isEmptyArray(fields);
    const addButtonTestProps = isCategoryLimitsEmpty ? {} : { testID: BudgetSelector.SetupCategoryLimitAddButton };

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
                <HapticPressable {...addButtonTestProps} accessibilityRole="button" onPress={handleAddPress} style={ADD_BUTTON_STYLE}>
                    <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={26} iconSize={14} />
                </HapticPressable>
            </View>
            <Text className="text-secondary-foreground text-sm">
                <Trans>Optional per-category caps within this budget</Trans>
            </Text>
            {isCategoryLimitsEmpty ? (
                <BudgetCategoryLimitsEmptyState onPress={handleAddPress} testID={BudgetSelector.SetupCategoryLimitAddButton} />
            ) : (
                fields.map((field, index) => <BudgetCategoryLimitCompactRow key={field.id} index={index} onRemove={remove} />)
            )}
        </View>
    );
};
