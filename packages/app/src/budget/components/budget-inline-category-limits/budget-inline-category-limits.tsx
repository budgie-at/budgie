import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitCompactRow } from '../budget-category-limit-compact-row/budget-category-limit-compact-row';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetCategoryLimitsEmptyState } from '../budget-category-limits-empty-state/budget-category-limits-empty-state';
import { BudgetLimitAmountInput } from '../budget-limit-amount-input/budget-limit-amount-input';

const BOTTOM_ADD_BUTTON_THRESHOLD = 5;

const styles = StyleSheet.create({
    headerAddButtonTarget: {
        height: 46,
        width: 46
    }
});

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

    const handleAdd = async () => {
        const result = await openCategorySelector({
            excludeCategoryIds: selectedCategoryIds,
            description: t`Pick a category to set a limit`
        });

        if (isPositiveNumber(result)) {
            shouldScrollOnNextLayoutRef.current = true;
            append({ categoryId: result, limitAmount: 0 });
        }
    };

    const handleAddPress = () => void handleAdd();

    const handleLayout = () => {
        if (shouldScrollOnNextLayoutRef.current) {
            shouldScrollOnNextLayoutRef.current = false;
            onCategoryAdded();
        }
    };

    return (
        <View className="gap-y-md" onLayout={handleLayout}>
            <View testID={BudgetSelector.SetupCategoryLimitsHeader} className="flex-row items-center justify-between">
                <Text className="text-primary text-lg font-semibold">
                    <Trans>Category limits</Trans>
                </Text>
                <View className="relative" collapsable={false} style={styles.headerAddButtonTarget}>
                    <Button
                        accessibilityLabel={t`Add category`}
                        leftIcon={UserIconNameEnum.Plus}
                        onPress={handleAddPress}
                        size="sm"
                        variant="ghost"
                    />
                    <View
                        collapsable={false}
                        nativeID={BudgetSelector.SetupCategoryLimitAddButton}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                        testID={BudgetSelector.SetupCategoryLimitAddButton}
                    />
                </View>
            </View>
            <Text className="text-secondary-foreground text-sm">
                <Trans>Optional per-category caps within this budget</Trans>
            </Text>
            <BudgetCategoryLimitCompactRowLayout
                amountInput={
                    <BudgetLimitAmountInput
                        currencySymbol={currencySymbol}
                        name="otherLimit"
                        testID={BudgetSelector.SetupOtherLimitAmountInput}
                    />
                }
                icon={<CircleIcon icon={UserIconNameEnum.CircleEllipsis} variant="ghost" size={32} iconSize={16} />}
                testID={BudgetSelector.SetupOtherLimitRow}
                title={t`Other`}
            />
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
