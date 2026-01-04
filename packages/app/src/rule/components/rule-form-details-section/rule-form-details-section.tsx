import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { RuleEnabledField } from '../rule-enabled-field/rule-enabled-field';
import { RuleTitleField } from '../rule-title-field/rule-title-field';

export const RuleFormDetailsSection = () => (
    <View className="gap-y-lg">
        <Text className="text-primary text-lg font-semibold">
            <Trans>Rule Details</Trans>
        </Text>
        <View className="gap-y-lg">
            <RuleTitleField />
            <RuleEnabledField />
        </View>
    </View>
);
