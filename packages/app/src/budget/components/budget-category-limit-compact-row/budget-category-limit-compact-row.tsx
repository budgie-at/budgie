import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View, ViewStyle } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RemovableFormRow } from '../../../@generic/component/removable-form-row/removable-form-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitAmountInput } from '../budget-category-limit-amount-input/budget-category-limit-amount-input';

const ICON_PLACEHOLDER_STYLE: ViewStyle = { width: 32, height: 32 };

interface Props {
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitCompactRow = ({ index, onRemove }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    const { category } = useGetCategoryByIdQuery(categoryId);

    const handleRemove = () => void onRemove(index);

    const icon = isDefined(category) ? (
        <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
    ) : (
        <View style={ICON_PLACEHOLDER_STYLE} />
    );

    const title = isDefined(category) ? category.title : '';

    return (
        <RemovableFormRow
            testID={BudgetSelector.SetupCategoryLimitRow(index)}
            removeTestID={BudgetSelector.SetupCategoryLimitRemoveButton(index)}
            density="compact"
            onRemove={handleRemove}
        >
            <View className="flex-row items-center gap-x-md">
                {icon}
                <Text className="text-primary text-md flex-1" numberOfLines={1}>
                    {title}
                </Text>
                <BudgetCategoryLimitAmountInput index={index} testID={BudgetSelector.SetupCategoryLimitAmountInput(index)} />
            </View>
        </RemovableFormRow>
    );
};
