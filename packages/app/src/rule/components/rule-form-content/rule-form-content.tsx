import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';

export const RuleFormContent = () => (
    <KeyboardAwareScrollView contentContainerClassName="pb-5xl" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-y-7xl">
            <RuleConditionsSection />
            <RuleActionsSection />
        </View>
    </KeyboardAwareScrollView>
);
