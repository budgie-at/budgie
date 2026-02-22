import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { EXCLUSIVE_ACTION_TYPES } from '../../constant/exclusive-action-types.constant';
import { RULE_ACTION_TYPE_OPTIONS } from '../../constant/rule-action-type-options.constant';
import { hasConvertibleTypeCondition } from '../../util/has-convertible-type-condition.util';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';

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
