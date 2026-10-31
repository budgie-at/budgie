import { BudgetRolloverModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetAllocationSummary } from '../budget-allocation-summary/budget-allocation-summary';
import { BudgetCategoryLimitCompactRow } from '../budget-category-limit-compact-row/budget-category-limit-compact-row';
import { BudgetCategoryLimitsEmptyState } from '../budget-category-limits-empty-state/budget-category-limits-empty-state';
import { BudgetInlineOtherLimitRow } from '../budget-inline-other-limit-row/budget-inline-other-limit-row';

const BOTTOM_ADD_BUTTON_THRESHOLD = 5;

interface Props {
    readonly currencySymbol: string;
    readonly onCategoryAdded: () => void;
}

export const BudgetInlineCategoryLimits = ({ currencySymbol, onCategoryAdded }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch({ control, name: 'categoryLimits' });
    const [openCategorySelector] = useCategorySelectorModal();
    const shouldScrollOnNextLayoutRef = useRef(false);

    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(isPositiveNumber);
    const isCategoryLimitsEmpty = isEmptyArray(fields);
    const isBottomAddButtonVisible = fields.length > BOTTOM_ADD_BUTTON_THRESHOLD;

    const handleAddPress = () => {
        openCategorySelector(
            {
                excludeCategoryIds: selectedCategoryIds,
                description: t`Pick a category to set a limit`
            },
            selectedCategoryId => {
                if (isPositiveNumber(selectedCategoryId)) {
                    shouldScrollOnNextLayoutRef.current = true;
                    append({ categoryId: selectedCategoryId, limitAmount: 0, rolloverMode: BudgetRolloverModeEnum.NONE });
                }
            }
        );
    };

    const handleLayout = () => {
        if (shouldScrollOnNextLayoutRef.current) {
            shouldScrollOnNextLayoutRef.current = false;
            onCategoryAdded();
        }
    };

    return (
        <View className="gap-y-md" onLayout={handleLayout}>
            <View testID={BudgetSelector.SetupCategoryLimitsHeader} className="flex-row items-center justify-between">
                <Text className="text-primary text-[15px] font-semibold" accessibilityRole="header">
                    <Trans>Category limits</Trans>
                </Text>
                <HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.SetupCategoryLimitAddButton} />
            </View>
            <BudgetAllocationSummary />
            <BudgetInlineOtherLimitRow currencySymbol={currencySymbol} />
            {isCategoryLimitsEmpty ? (
                <BudgetCategoryLimitsEmptyState onPress={handleAddPress} />
            ) : (
                fields.map((field, index) => (
                    <BudgetCategoryLimitCompactRow key={field.id} currencySymbol={currencySymbol} index={index} onRemove={remove} />
                ))
            )}
            {isBottomAddButtonVisible ? (
                <Button
                    testID={BudgetSelector.SetupCategoryLimitBottomAddButton}
                    variant="ghost"
                    size="sm"
                    leftIcon={UserIconNameEnum.Plus}
                    content={t`Add category`}
                    onPress={handleAddPress}
                />
            ) : null}
        </View>
    );
};
