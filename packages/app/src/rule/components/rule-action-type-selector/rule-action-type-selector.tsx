import {
    RuleActionTypeEnum,
    RuleConditionCreateInputInterface,
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
import { EXCLUSIVE_ACTION_TYPES } from '../../constant/exclusive-action-types.constant';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';

interface RuleActionTypeOptionInterface {
    readonly value: RuleActionTypeEnum;
    readonly label: MessageDescriptor;
}

const CONVERTIBLE_TRANSACTION_TYPES: TransactionTypeEnum[] = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME];

const hasConvertibleTypeCondition = (conditions: RuleConditionCreateInputInterface[]): boolean =>
    conditions.some(
        ({ field, operator, value }) =>
            field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(value, TransactionTypeEnum) &&
            CONVERTIBLE_TRANSACTION_TYPES.includes(value)
    );

const RULE_ACTION_TYPE_OPTIONS: RuleActionTypeOptionInterface[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` },
    { value: RuleActionTypeEnum.CONVERT_TO_TRANSFER, label: msg`Convert to Transfer` }
];

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionTypeSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const conditions = useWatch({ control, name: 'conditions' });
    const actions = useWatch({ control, name: 'actions' });

    const canConvertToTransfer = hasConvertibleTypeCondition(conditions);

    const usedExclusiveTypes = new Set(
        actions
            .filter((_, actionIndex) => actionIndex !== index)
            .map(action => action.type)
            .filter(type => EXCLUSIVE_ACTION_TYPES.has(type))
    );

    const availableOptions = RULE_ACTION_TYPE_OPTIONS.filter(
        ({ value }) => (value !== RuleActionTypeEnum.CONVERT_TO_TRANSFER || canConvertToTransfer) && !usedExclusiveTypes.has(value)
    );

    const options = availableOptions.map(option => ({ value: option.value, label: t(option.label) }));
    const getDisplayValue = (value: RuleActionTypeEnum) => options.find(option => option.value === value)?.label ?? t`Select Type`;

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.type`>) => (
        <RuleActionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            label={t`Action Type`}
            sheetTitle={t`Select Action Type`}
            displayValue={getDisplayValue(value)}
            testID={testID}
        />
    );

    return <Controller control={control} name={`actions.${index}.type`} render={renderSelector} />;
};
