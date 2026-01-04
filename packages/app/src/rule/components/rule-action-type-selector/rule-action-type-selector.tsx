import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';

interface Props {
    readonly index: number;
}

const ACTION_TYPE_OPTIONS: { value: RuleActionTypeEnum; label: MessageDescriptor }[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` }
];

export const RuleActionTypeSelector = ({ index }: Props) => {
    const { t, i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const options = ACTION_TYPE_OPTIONS.map(option => ({ value: option.value, label: i18n.t(option.label) }));
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
