import { Text, View } from 'react-native';

import { RuleFormSelector } from '../rule/components/rule-form-layout/rule-form-layout.selector';
import { RuleSelectorOptionRow } from '../rule/components/rule-selector-option-row/rule-selector-option-row';
import { useRuleSelectorModal, useRuleSelectorModalParams } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector] = useRuleSelectorModal();
    const currentParams = useRuleSelectorModalParams();

    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <View className="flex-1 bg-primary-reverse p-5xl gap-y-lg">
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
