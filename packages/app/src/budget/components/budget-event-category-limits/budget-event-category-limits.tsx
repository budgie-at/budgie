import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetAddCategoryLimitRow } from '../budget-add-category-limit-row/budget-add-category-limit-row';
import { BudgetEventAllocationNote } from '../budget-event-allocation-note/budget-event-allocation-note';
import { BudgetEventCategoryLimitRow } from '../budget-event-category-limit-row/budget-event-category-limit-row';
import { BudgetEventRemovedLimitNote } from '../budget-event-removed-limit-note/budget-event-removed-limit-note';
import { BudgetGroupedSectionHeader } from '../budget-grouped-section-header/budget-grouped-section-header';

import type { BudgetEventRemovedLimitInterface } from '../../interface/budget-event-removed-limit.interface';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetEventCategoryLimits = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control, getValues } = useFormContext<BudgetEventFormValues>();
    const { fields, append, insert, remove } = useFieldArray({ control, name: 'categoryLimits' });
    const categoryLimits = useWatch({ control, name: 'categoryLimits' });
    const [openCategorySelector] = useCategorySelectorModal();
    const [removedLimit, setRemovedLimit] = useState<BudgetEventRemovedLimitInterface | null>(null);
    const selectedCategoryIds = categoryLimits.map(limit => limit.categoryId).filter(isPositiveNumber);

    const handleAddPress = () => {
        openCategorySelector(
            { excludeCategoryIds: selectedCategoryIds, description: t`Pick a category to set a limit` },
            selectedCategoryId => {
                if (isPositiveNumber(selectedCategoryId)) {
                    setRemovedLimit(null);
                    append(
                        { categoryId: selectedCategoryId, limitAmount: 0, rolloverMode: BudgetRolloverModeEnum.NONE },
                        { focusName: `categoryLimits.${fields.length}.limitAmount` }
                    );
                }
            }
        );
    };

    const handleRemove = (index: number) => {
        setRemovedLimit({ index, limit: categoryLimits[index] });
        remove(index);
    };

    const handleUndo = () => {
        if (isDefined(removedLimit) && !getValues('categoryLimits').some(limit => limit.categoryId === removedLimit.limit.categoryId)) {
            insert(removedLimit.index, removedLimit.limit);
        }

        setRemovedLimit(null);
    };

    const isEmpty = isEmptyArray(fields);
    const addAction = isEmpty ? null : (
        <HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.EventCategoryLimitAddButton} />
    );

    return (
        <View>
            <BudgetGroupedSectionHeader label={t`Category limits`} trailing={addAction} />
            <GroupedListSection>
                {fields.map((field, index) => (
                    <BudgetEventCategoryLimitRow key={field.id} currencySymbol={currencySymbol} index={index} onRemove={handleRemove} />
                ))}
                {isEmpty ? (
                    <BudgetAddCategoryLimitRow testID={BudgetSelector.EventCategoryLimitAddButton} onPress={handleAddPress} />
                ) : null}
            </GroupedListSection>
            {isEmpty ? (
                <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
                    <Trans>Optional. Cap a category inside the event limit.</Trans>
                </Text>
            ) : (
                <BudgetEventAllocationNote currencySymbol={currencySymbol} />
            )}
            {isDefined(removedLimit) ? (
                <BudgetEventRemovedLimitNote categoryId={removedLimit.limit.categoryId} onUndo={handleUndo} />
            ) : null}
        </View>
    );
};
