import { Text, View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { RuleFormSelector } from '../rule/components/rule-form-layout/rule-form-layout.selector';
import { RuleSelectorOptionRow } from '../rule/components/rule-selector-option-row/rule-selector-option-row';
import { useRuleSelectorModal } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector, currentParams] = useRuleSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;
    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle} className="p-5xl gap-y-lg">
            <Text className="text-primary text-lg font-semibold mb-lg">{currentParams?.title ?? ''}</Text>

            {options.map(option => (
                <RuleSelectorOptionRow
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    isSelected={option.value === selectedValue}
                    onPress={resolveRuleSelector}
                    testID={RuleFormSelector.SelectorCard(option.value)}
                />
            ))}
        </View>
    );
}
