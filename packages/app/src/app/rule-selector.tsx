import { Text, View } from 'react-native';

import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { RuleFormSelector } from '../rule/components/rule-form-layout/rule-form-layout.selector';
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
                <SelectorCard<string>
                    key={option.value}
                    identifier={option.value}
                    isSelected={option.value === selectedValue}
                    onSelect={resolveRuleSelector}
                    title={<Text className="text-primary text-md font-semibold">{option.label}</Text>}
                    iconSlot={null}
                    testID={RuleFormSelector.SelectorCard(option.value)}
                />
            ))}
        </View>
    );
}
