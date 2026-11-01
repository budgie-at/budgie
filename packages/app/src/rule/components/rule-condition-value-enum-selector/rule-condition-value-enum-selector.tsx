import { UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface EnumOption {
    readonly value: string;
    readonly label: MessageDescriptor;
    readonly icon: UserIconNameEnum;
}

interface Props {
    readonly index: number;
    readonly options: readonly EnumOption[];
    readonly icon: UserIconNameEnum;
    readonly sheetTitle: string;
    readonly placeholder: string;
    readonly testID?: string;
}

export const RuleConditionValueEnumSelector = ({ index, options, icon, sheetTitle, placeholder, testID }: Props) => {
    const { t } = useLingui();
    const { value, onChange, isMissing } = useRuleConditionValueField(index);
    const [openRuleSelector] = useRuleSelectorModal();
    const selectedOption = options.find(option => option.value === value);
    const selectedLabel = isDefined(selectedOption) ? t(selectedOption.label) : null;

    const handleOpen = () => {
        openRuleSelector(
            {
                title: sheetTitle,
                options: options.map(option => ({
                    value: option.value,
                    label: t(option.label),
                    description: null,
                    icon: option.icon,
                    glyph: null,
                    disabledReason: null
                })),
                selectedValue: value
            },
            result => {
                if (isDefined(result)) {
                    onChange(result);
                }
            }
        );
    };

    return (
        <RuleValuePickerButton
            value={selectedLabel}
            placeholder={placeholder}
            name={sheetTitle}
            isMissing={isMissing}
            leading={<RuleValueGlyph icon={selectedOption?.icon ?? icon} variant="ghost" />}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
