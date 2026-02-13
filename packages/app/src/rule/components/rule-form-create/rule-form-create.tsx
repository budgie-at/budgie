import { useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { RuleFormResultType } from '../../context/rule-form-modal.context';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { RulePrefillDataInterface } from '../../interface/rule-prefill-data.interface';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

interface Props {
    readonly prefillData?: RulePrefillDataInterface;
    readonly onSuccess: (result: RuleFormResultType) => void;
    readonly onCancel: () => void;
}

export const RuleFormCreate = ({ prefillData, onSuccess, onCancel }: Props) => {
    const { t } = useLingui();
    const { form, handleSubmit } = useRuleForm({ prefillData, onSuccess });

    return (
        <FormProvider {...form}>
            {/* jscpd:ignore-start */}
            <ModalPage header={<PageHeader testID={RuleFormSelectors.Page} title={t`Create Rule`} onGoBack={onCancel} />}>
                <KeyboardAwareScrollView
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-5xl gap-y-7xl">
                        <RuleConditionsSection />
                        <RuleActionsSection />
                    </View>
                    <View className="px-5xl mt-3xl">
                        <RuleFormApplyToggle />
                    </View>
                    {/* jscpd:ignore-end */}
                </KeyboardAwareScrollView>

                <View className="px-3xl pb-3xl gap-y-md pt-xl">
                    <View className="flex-row gap-x-md">
                        <ModalFormCancelButton onPress={onCancel} />
                        <ModalFormSaveButton testID={RuleFormSelectors.SubmitButton} onPress={handleSubmit} />
                    </View>
                </View>
            </ModalPage>
        </FormProvider>
    );
};
