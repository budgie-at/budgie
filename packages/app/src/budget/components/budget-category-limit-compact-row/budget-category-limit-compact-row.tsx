import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View, ViewStyle } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetLimitAmountInput } from '../budget-limit-amount-input/budget-limit-amount-input';

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
            <BudgetCategoryLimitCompactRowLayout
                amountInput={
                    <BudgetLimitAmountInput
                        currencySymbol={currencySymbol}
                        name={`categoryLimits.${index}.limitAmount`}
                        testID={BudgetSelector.SetupCategoryLimitAmountInput(index)}
                    />
                }
                icon={icon}
                testID={BudgetSelector.SetupCategoryLimitRow(index)}
                title={title}
            />
        </DeletableRow>
    );
};
