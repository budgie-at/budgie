import { RuleCreateInputInterface, RuleEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useRuleForm } from '../../hooks/use-rule-form.hook';
import { ruleService } from '../../service/rule.service';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

type RuleFormAction = 'created' | 'updated' | 'cancelled';

export interface RuleFormResult {
    readonly rule: RuleEntityInterface;
    readonly action: RuleFormAction;
}

interface Props {
    readonly ruleId?: number;
    readonly input?: RuleCreateInputInterface;
    readonly onSuccess: (result: RuleFormResult) => void;
    readonly onCancel: () => void;
}

export const RuleForm = (props: Props) => {
    const { ruleId, input, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const [hapticNotification] = useVibration();

    const form = useRuleForm(input);

    const isEditing = isDefined(ruleId);
    const headerTitle = isEditing ? t`Edit Rule` : t`Create Rule`;

    const handleSubmit = async (values: RuleCreateInputInterface) => {
        try {
            if (isEditing && isDefined(ruleId)) {
                const rule = await ruleService.updateById(ruleId, values);
                hapticNotification(NotificationFeedbackType.Success);
                onSuccess({ rule, action: 'updated' });
            } else {
                const rule = await ruleService.create(values);
                hapticNotification(NotificationFeedbackType.Success);
                onSuccess({ rule, action: 'created' });
            }
        } catch {
            hapticNotification(NotificationFeedbackType.Error);
            const errorMessage = isEditing ? t`Could not save rule` : t`Could not create rule`;
            showErrorToast(errorMessage, t`Please try again later`);
        }
    };

    const handleValidationError = () => {
        hapticNotification(NotificationFeedbackType.Error);
    };

    return (
        <FormProvider {...form}>
            <ModalPage header={<PageHeader title={headerTitle} onGoBack={onCancel} />}>
                <KeyboardAwareScrollView
                    bounces={false}
                    contentContainerClassName="pb-5xl"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="gap-y-7xl">
                        <RuleConditionsSection />
                        <RuleActionsSection />
                    </View>
                    <View className="px-5xl mt-3xl">
                        <RuleFormApplyToggle />
                    </View>
                </KeyboardAwareScrollView>

                <View className="flex-row gap-x-md pt-2xl">
                    <ModalFormCancelButton onPress={onCancel} />
                    <ModalFormSaveButton onPress={form.handleSubmit(handleSubmit, handleValidationError)} />
                </View>
            </ModalPage>
        </FormProvider>
    );
};
