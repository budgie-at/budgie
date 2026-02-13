import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { Button } from '../../../@generic/component/button/button';
import { FormSheetSpacer } from '../../../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RulePrefillDataInterface } from '../../interface/rule-prefill-data.interface';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

interface Props {
    readonly prefillData?: RulePrefillDataInterface;
    readonly onSuccess: (result: RuleFormResultType) => void;
}

export const RuleFormCreate = ({ prefillData, onSuccess }: Props) => {
    const { t } = useLingui();
    const { backgroundColor } = useFormsheetListStyles();
    const { form, handleSubmit } = useRuleForm({ prefillData, onSuccess });

    const containerStyle = { flex: 1, backgroundColor };

    return (
        <FormProvider {...form}>
            {/* jscpd:ignore-start */}
            <View testID={RuleFormSelectors.Page} style={containerStyle}>
                <KeyboardAwareScrollView
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <BottomSheetHeader size="md" title={t`Create Rule`} />
                    <View className="px-5xl gap-y-7xl">
                        <RuleConditionsSection />
                        <RuleActionsSection />
                    </View>
                    <View className="px-5xl mt-3xl">
                        <RuleFormApplyToggle />
                    </View>
                    {/* jscpd:ignore-end */}
                    <View className="px-5xl pt-5xl">
                        <Button
                            testID={RuleFormSelectors.SubmitButton}
                            leftIcon={UserIconNameEnum.CircleCheck}
                            onPress={handleSubmit}
                            variant="ghost"
                            content={t`Create Rule`}
                        />
                    </View>
                </KeyboardAwareScrollView>
                <FormSheetSpacer />
            </View>
        </FormProvider>
    );
};
