import { isDefined } from '@rnw-community/shared';

import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';

interface Option<T extends string> {
    value: T;
    label: string;
}

interface Props<T extends string> {
    readonly value: T | null;
    readonly onChange: (value: T) => void;
    readonly options: Option<T>[];
    readonly label: string;
    readonly sheetTitle: string;
    readonly displayValue: string;
    readonly testID?: string;
}

export const RuleActionBottomSheetSelector = <T extends string>(props: Props<T>) => {
    const { value, onChange, options, label, sheetTitle, displayValue, testID } = props;
    const { openRuleSelector } = useRuleSelectorModal();

    const handleOpen = async () => {
        const result = await openRuleSelector({
            title: sheetTitle,
            options,
            selectedValue: value
        });

        const matchedOption = options.find(option => option.value === result);
        if (isDefined(matchedOption)) {
            onChange(matchedOption.value);
        }
    };

    return <RuleSelectorField testID={testID} label={label} value={displayValue} onPress={handleOpen} />;
};
