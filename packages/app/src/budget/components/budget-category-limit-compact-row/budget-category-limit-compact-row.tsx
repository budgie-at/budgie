import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View, ViewStyle } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitAmountInput } from '../budget-category-limit-amount-input/budget-category-limit-amount-input';

const ICON_PLACEHOLDER_STYLE: ViewStyle = { width: 32, height: 32 };

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitCompactRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    const { category } = useGetCategoryByIdQuery(categoryId);

    const icon = isDefined(category) ? (
        <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
    ) : (
        <View style={ICON_PLACEHOLDER_STYLE} />
    );

    const title = category?.title ?? '';
    const confirmation = {
        title: t`Remove category limit?`,
        description: t`Swipe to remove this per-category cap from your budget.`,
        buttonText: t`Remove`
    };

    return (
        <DeletableRow id={index} onDelete={onRemove} confirmation={confirmation}>
            <View
                testID={BudgetSelector.SetupCategoryLimitRow(index)}
                collapsable={false}
                className="flex-row items-center gap-x-md bg-primary-reverse px-md py-sm rounded-2xl"
            >
                {icon}
                <Text className="text-primary text-md flex-1" numberOfLines={1}>
                    {title}
                </Text>
                <BudgetCategoryLimitAmountInput
                    currencySymbol={currencySymbol}
                    index={index}
                    testID={BudgetSelector.SetupCategoryLimitAmountInput(index)}
                />
            </View>
        </DeletableRow>
    );
};
