import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';

interface Props {
    readonly index: number;
}

const ACTION_TYPE_OPTIONS: { value: RuleActionTypeEnum; label: MessageDescriptor }[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` },
    { value: RuleActionTypeEnum.CONVERT_TO_TRANSFER, label: msg`Convert to Transfer` }
];

const CONVERTIBLE_TRANSACTION_TYPES: TransactionTypeEnum[] = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME];

export const RuleActionTypeSelector = ({ index }: Props) => {
    const { t, i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const conditions = useWatch({ control, name: 'conditions' });

    const hasConvertibleTypeCondition = conditions.some(
        condition =>
            condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            condition.operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(condition.value, TransactionTypeEnum) &&
            CONVERTIBLE_TRANSACTION_TYPES.includes(condition.value)
    );

    const availableOptions = ACTION_TYPE_OPTIONS.filter(
        option => option.value !== RuleActionTypeEnum.CONVERT_TO_TRANSFER || hasConvertibleTypeCondition
    );

    const options = availableOptions.map(option => ({ value: option.value, label: i18n.t(option.label) }));
    const getDisplayValue = (value: RuleActionTypeEnum) => options.find(option => option.value === value)?.label ?? t`Select Type`;

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.type`>) => (
        <RuleActionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            label={t`Action Type`}
            sheetTitle={t`Select Action Type`}
            displayValue={getDisplayValue(value)}
        />
    );

    return <Controller control={control} name={`actions.${index}.type`} render={renderSelector} />;
};
