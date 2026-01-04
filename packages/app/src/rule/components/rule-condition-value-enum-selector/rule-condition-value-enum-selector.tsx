import { RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleConditionBottomSheetSelector } from '../rule-condition-bottom-sheet-selector/rule-condition-bottom-sheet-selector';

interface EnumOption {
    readonly value: string;
    readonly label: MessageDescriptor;
}

interface Props {
    readonly index: number;
    readonly options: EnumOption[];
    readonly sheetTitle: string;
    readonly defaultLabel: string;
}

export const RuleConditionValueEnumSelector = ({ index, options, sheetTitle, defaultLabel }: Props) => {
    const { i18n, t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const translatedOptions = options.map(option => ({ value: option.value, label: i18n.t(option.label) }));
    const getLabel = (value: string) => translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    const renderSelector = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => (
        <RuleConditionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={translatedOptions}
            sheetTitle={sheetTitle}
            getLabel={getLabel}
        />
    );

    return (
        <FormItem label={t`Value`}>
            <Controller control={control} name={`conditions.${index}.value`} render={renderSelector} />
        </FormItem>
    );
};
