import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { RuleSelectorButton } from '../rule-selector-button/rule-selector-button';

interface Option<T extends string> {
    readonly value: T;
    readonly label: MessageDescriptor;
}

interface Props<T extends string> {
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly options: Option<T>[];
    readonly sheetTitle: string;
    readonly defaultLabel: string;
    readonly testID?: string;
}

export const RuleOptionPicker = <T extends string>(props: Props<T>) => {
    const { value, onChange, options, sheetTitle, defaultLabel, testID } = props;
    const { t } = useLingui();
    const [openRuleSelector] = useRuleSelectorModal();

    const translatedOptions = options.map(option => ({ value: option.value, label: t(option.label) }));
    const displayLabel = translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    const handleOpen = () => {
        openRuleSelector(
            {
                title: sheetTitle,
                options: translatedOptions,
                selectedValue: value
            },
            result => {
                const matchedOption = translatedOptions.find(option => option.value === result);
                if (isDefined(matchedOption)) {
                    onChange(matchedOption.value);
                }
            }
        );
    };

    return <RuleSelectorButton testID={testID} value={displayLabel} onPress={handleOpen} />;
};
