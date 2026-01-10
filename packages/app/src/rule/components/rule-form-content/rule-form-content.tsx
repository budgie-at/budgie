import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

export const RuleFormContent = () => (
    <KeyboardAwareScrollView contentContainerClassName="pb-5xl" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-y-7xl">
            <RuleConditionsSection />
            <RuleActionsSection />
        </View>
        <View className="px-5xl mt-3xl">
            <RuleFormApplyToggle />
        </View>
    </KeyboardAwareScrollView>
);
