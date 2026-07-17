import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ModalPage } from '../../../@generic/component/page/modal-page';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';

interface Props {
    readonly header: ReactNode;
    readonly footer: ReactNode;
    readonly ruleId?: number;
}

export const RuleFormLayout = ({ header, footer, ruleId }: Props) => {
    const [footerHeight, setFooterHeight] = useState(0);

    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    const contentContainerStyle = { paddingBottom: footerHeight };

    return (
        <ModalPage header={header}>
            <KeyboardAwareScrollView
                contentContainerStyle={contentContainerStyle}
                contentContainerClassName="pb-5xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="px-3xl gap-y-3xl">
                    <RuleConditionsSection />
                    <RuleActionsSection ruleId={ruleId} />
                </View>
            </KeyboardAwareScrollView>

            <View onLayout={handleFooterLayout}>{footer}</View>
        </ModalPage>
    );
};
