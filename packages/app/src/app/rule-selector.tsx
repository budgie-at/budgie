import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { RuleFormSelector } from '../rule/components/rule-form-layout/rule-form-layout.selector';
import { RuleSelectorOptionRow } from '../rule/components/rule-selector-option-row/rule-selector-option-row';
import { useRuleSelectorModal, useRuleSelectorModalParams } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector, dismissRuleSelector] = useRuleSelectorModal();
    useModalDismiss(dismissRuleSelector);
    const currentParams = useRuleSelectorModalParams();
    const contentStyle = useResolveClassNames('bg-primary-reverse');
    const screenOptions = { contentStyle };

    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <View className="bg-primary-reverse px-xl pt-3xl pb-safe-offset-[16px] gap-y-sm" collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <Text className="text-primary text-xl font-semibold px-md pb-md" accessibilityRole="header">
                {currentParams?.title ?? ''}
            </Text>

            {options.map(option => (
                <RuleSelectorOptionRow
                    key={option.value}
                    option={option}
                    isSelected={option.value === selectedValue}
                    onPress={resolveRuleSelector}
                    testID={RuleFormSelector.SelectorCard(option.value)}
                />
            ))}
        </View>
    );
}
