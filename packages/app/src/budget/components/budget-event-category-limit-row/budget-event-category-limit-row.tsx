import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';
import { View, ViewStyle } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';

const ICON_PLACEHOLDER_STYLE: ViewStyle = { width: 32, height: 32 };

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetEventCategoryLimitRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });
    const { category } = useGetCategoryByIdQuery(categoryId);
    const icon = isDefined(category) ? (
        <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
    ) : (
        <View style={ICON_PLACEHOLDER_STYLE} />
    );
    const title = isDefined(category) ? category.title : '';
    const confirmation = {
        title: t`Remove category limit?`,
        description: t`Swipe to remove this per-category cap from your budget.`,
        buttonText: t`Remove`
    };

    const renderAmount = ({
        field: { value, onChange }
    }: UseControllerReturn<BudgetEventFormValues, `categoryLimits.${number}.limitAmount`>) => (
        <AmountInput
            value={value}
            onChangeValue={onChange}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            textAlign="right"
            inputClassName="min-w-[104px] max-w-[136px]"
            commitOnBlur
            selectTextOnFocus
        />
    );

    return (
        <DeletableRow id={index} onDelete={onRemove} confirmation={confirmation}>
            <BudgetCategoryLimitCompactRowLayout
                amountInput={<Controller control={control} name={`categoryLimits.${index}.limitAmount`} render={renderAmount} />}
                icon={icon}
                subtitle={null}
                testID={BudgetSelector.EventCategoryLimitRow(index)}
                title={title}
            />
        </DeletableRow>
    );
};
