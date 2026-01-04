import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { RuleEnabledField } from '../rule-enabled-field/rule-enabled-field';
import { RulePriorityField } from '../rule-priority-field/rule-priority-field';
import { RuleTitleField } from '../rule-title-field/rule-title-field';

export const RuleFormDetailsSection = () => {
    const { t } = useLingui();

    return (
        <View className="gap-y-lg">
            <Text className="text-primary text-lg font-semibold">{t`Rule Details`}</Text>
            <View className="gap-y-lg">
                <RuleTitleField />
                <View className="flex-row gap-x-lg">
                    <RulePriorityField />
                    <RuleEnabledField />
                </View>
            </View>
        </View>
    );
};
