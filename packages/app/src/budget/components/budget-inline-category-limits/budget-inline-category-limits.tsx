import { BudgetRolloverModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetAllocationSummary } from '../budget-allocation-summary/budget-allocation-summary';
import { BudgetCategoryLimitCompactRow } from '../budget-category-limit-compact-row/budget-category-limit-compact-row';
import { BudgetGroupedSectionHeader } from '../budget-grouped-section-header/budget-grouped-section-header';
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
            <BudgetGroupedSectionHeader
                label={t`Category limits`}
                testID={BudgetSelector.SetupCategoryLimitsHeader}
                trailing={<HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.SetupCategoryLimitAddButton} />}
            />
            <GroupedListSection>
                <BudgetInlineOtherLimitRow currencySymbol={currencySymbol} />
                {fields.map((field, index) => (
                    <BudgetCategoryLimitCompactRow key={field.id} currencySymbol={currencySymbol} index={index} onRemove={remove} />
                ))}
                {isCategoryLimitsEmpty || isBottomAddButtonVisible ? (
                    <GroupedListRow
                        left={<GroupedListIcon icon={UserIconNameEnum.ListPlus} />}
                        title={t`Add a category limit`}
                        titleClassName="text-default-foreground"
                        testID={BudgetSelector.SetupCategoryLimitBottomAddButton}
                        onPress={handleAddPress}
                    />
                ) : null}
            </GroupedListSection>
            <View className="px-3xl">
                <BudgetAllocationSummary />
            </View>
        </View>
    );
};
