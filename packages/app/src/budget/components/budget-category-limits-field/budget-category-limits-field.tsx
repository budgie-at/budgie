import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitFormRow } from '../budget-category-limit-form-row/budget-category-limit-form-row';

const DEFAULT_CATEGORY_LIMIT: BudgetFormValues['categoryLimits'][number] = {
    categoryId: 0,
    limitAmount: 0
};

export const BudgetCategoryLimitsField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const { fields, append, remove } = useFieldArray<BudgetFormValues, 'categoryLimits'>({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch<BudgetFormValues, 'categoryLimits'>({ control, name: 'categoryLimits' });

    const handleAdd = () => void append(DEFAULT_CATEGORY_LIMIT);
    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(id => id > 0);

    return (
        <View className="gap-y-md">
            <View testID={BudgetSelector.SetupCategoryLimitsHeader} className="flex-row items-center justify-between">
                <Text className="text-primary text-lg font-semibold">{t`Category limits`}</Text>

                <HapticPressable testID={BudgetSelector.SetupCategoryLimitAddButton} onPress={handleAdd}>
                    <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={26} iconSize={14} />
                </HapticPressable>
            </View>

            <Text className="text-secondary-foreground text-sm">
                <Trans>Optional per-category caps within this budget</Trans>
            </Text>

            {fields.map((field, index) => {
                const excludeIds = selectedCategoryIds.filter(id => id !== categoryLimits[index]?.categoryId);

                return <BudgetCategoryLimitFormRow key={field.id} index={index} excludeCategoryIds={excludeIds} onRemove={remove} />;
            })}
        </View>
    );
};
