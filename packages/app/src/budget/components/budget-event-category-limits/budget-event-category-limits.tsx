import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetEventCategoryLimitRow } from '../budget-event-category-limit-row/budget-event-category-limit-row';

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

    return (
        <View className="gap-y-md">
            <View className="flex-row items-center justify-between px-3xl">
                <Text className="text-primary text-[15px] font-semibold" accessibilityRole="header">
                    <Trans>Category limits</Trans>
                </Text>
                <HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.EventCategoryLimitAddButton} />
            </View>
            {fields.map((field, index) => (
                <BudgetEventCategoryLimitRow key={field.id} currencySymbol={currencySymbol} index={index} onRemove={remove} />
            ))}
            {isEmptyArray(fields) ? (
                <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                    <Trans>Optional. Leave empty to track the event as a single limit.</Trans>
                </Text>
            ) : null}
        </View>
    );
};
