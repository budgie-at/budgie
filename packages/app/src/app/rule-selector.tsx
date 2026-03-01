import { Text, View } from 'react-native';

import { RuleFormSelectors } from '../@e2e/selectors/rule-form.selector';
import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { useRuleSelectorModal } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector, currentParams] = useRuleSelectorModal();

    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <View className="p-5xl gap-y-lg">
            <Text className="text-primary text-lg font-semibold mb-lg">{currentParams?.title ?? ''}</Text>

            {options.map(option => (
                <SelectorCard<string>
                    key={option.value}
                    identifier={option.value}
                    isSelected={option.value === selectedValue}
                    onSelect={resolveRuleSelector}
                    title={option.label}
                    iconSlot={null}
                    testID={RuleFormSelectors.SelectorCard(option.value)}
                />
            ))}
        </View>
    );
}
