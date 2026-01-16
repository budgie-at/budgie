import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
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
    readonly testID?: string;
}

export const RuleConditionValueEnumSelector = ({ index, options, sheetTitle, defaultLabel, testID }: Props) => {
    const { t } = useLingui();
    const { value, onChange } = useRuleConditionValueField(index);

    return (
        <FormItem label={t`Value`}>
            <RuleConditionBottomSheetSelector
                value={value}
                onChange={onChange}
                options={options}
                sheetTitle={sheetTitle}
                defaultLabel={defaultLabel}
                testID={testID}
            />
        </FormItem>
    );
};
