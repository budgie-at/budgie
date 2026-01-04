import { RuleCreateInputInterface } from '@budgie/contracts';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleApplyToExistingToggle } from '../rule-apply-to-existing-toggle/rule-apply-to-existing-toggle';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';

const renderApplyToExistingToggle = ({
    field: { value, onChange }
}: UseControllerReturn<RuleCreateInputInterface, 'applyToExisting'>) => <RuleApplyToExistingToggle value={value} onChange={onChange} />;

export const RuleFormContent = () => {
    const { control } = useFormContext<RuleCreateInputInterface>();

    return (
        <KeyboardAwareScrollView contentContainerClassName="pb-5xl" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="gap-y-7xl">
                <RuleConditionsSection />
                <RuleActionsSection />
            </View>
            <View className="px-5xl mt-3xl">
                <Controller control={control} name="applyToExisting" render={renderApplyToExistingToggle} />
            </View>
        </KeyboardAwareScrollView>
    );
};
