import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { EXCLUSIVE_ACTION_TYPES } from '../../constant/exclusive-action-types.constant';
import { RuleOptionPicker } from '../rule-option-picker/rule-option-picker';

interface RuleActionTypeOptionInterface {
    readonly value: RuleActionTypeEnum;
    readonly label: MessageDescriptor;
}

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
    const actions = useWatch({ control, name: 'actions' });

    const usedExclusiveTypes = new Set(
        actions
            .filter((_, actionIndex) => actionIndex !== index)
            .map(action => action.type)
            .filter(type => EXCLUSIVE_ACTION_TYPES.has(type))
    );

    const availableOptions = RULE_ACTION_TYPE_OPTIONS.filter(({ value }) => !usedExclusiveTypes.has(value));

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.type`>) => (
        <FormItem label={t`Action Type`}>
            <RuleOptionPicker
                value={value}
                onChange={onChange}
                options={availableOptions}
                sheetTitle={t`Select Action Type`}
                defaultLabel={t`Select Type`}
                testID={testID}
            />
        </FormItem>
    );

    return <Controller control={control} name={`actions.${index}.type`} render={renderSelector} />;
};
