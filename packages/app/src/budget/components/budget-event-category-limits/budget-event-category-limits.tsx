import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetAddCategoryLimitRow } from '../budget-add-category-limit-row/budget-add-category-limit-row';
import { BudgetEventCategoryLimitRow } from '../budget-event-category-limit-row/budget-event-category-limit-row';
import { BudgetGroupedSectionHeader } from '../budget-grouped-section-header/budget-grouped-section-header';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetEventCategoryLimits = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch({ control, name: 'categoryLimits' });
    const [openCategorySelector] = useCategorySelectorModal();
    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(isPositiveNumber);

    const handleAddPress = () => {
        openCategorySelector(
            { excludeCategoryIds: selectedCategoryIds, description: t`Pick a category to set a limit` },
            selectedCategoryId => {
                if (isPositiveNumber(selectedCategoryId)) {
                    append({ categoryId: selectedCategoryId, limitAmount: 0, rolloverMode: BudgetRolloverModeEnum.NONE });
                }
            }
        );
    };

    const isEmpty = isEmptyArray(fields);
    const addAction = isEmpty ? null : (
        <HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.EventCategoryLimitAddButton} />
    );

    return (
        <View className="gap-y-md">
            <BudgetGroupedSectionHeader label={t`Category limits`} trailing={addAction} />
            <GroupedListSection>
                {fields.map((field, index) => (
                    <BudgetEventCategoryLimitRow key={field.id} currencySymbol={currencySymbol} index={index} onRemove={remove} />
                ))}
                {isEmpty ? (
                    <BudgetAddCategoryLimitRow testID={BudgetSelector.EventCategoryLimitAddButton} onPress={handleAddPress} />
                ) : null}
            </GroupedListSection>
            <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                <Trans>Optional. Leave empty to track the event as a single limit.</Trans>
            </Text>
        </View>
    );
};
