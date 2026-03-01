import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ModalPage } from '../../../@generic/component/page/modal-page';
import { RuleCreationProgressInterface } from '../../interface/rule-creation-progress.interface';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleFormApplyToggle } from '../rule-form-apply-toggle/rule-form-apply-toggle';

interface Props {
    readonly header: ReactNode;
    readonly footer: ReactNode;
    readonly progress: RuleCreationProgressInterface | null;
    readonly ruleId?: number;
}

export const RuleFormLayout = ({ header, footer, progress, ruleId }: Props) => (
    <ModalPage header={header}>
        <KeyboardAwareScrollView
            contentContainerClassName="pb-5xl"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View className="px-3xl gap-y-3xl">
                <RuleConditionsSection />
                <RuleActionsSection ruleId={ruleId} />
            </View>
            <View className="px-3xl mt-3xl">
                <RuleFormApplyToggle progress={progress} />
            </View>
        </KeyboardAwareScrollView>

        {footer}
    </ModalPage>
);
