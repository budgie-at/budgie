import { useRef } from 'react';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { RuleFormScrollContext } from '../../context/rule-form-scroll.context';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleSummaryHero } from '../rule-summary-hero/rule-summary-hero';

import type { ReactNode } from 'react';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly title: string;
    readonly footer: ReactNode;
    readonly onCancel: () => void;
    readonly ruleId?: number;
    readonly children?: ReactNode;
}

export const RuleFormScreen = ({ title, footer, onCancel, ruleId, children }: Props) => {
    const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
    const scrollViewProps = { ref: scrollRef };

    return (
        <RuleFormScrollContext value={scrollRef}>
            <CollapsibleChromePage
                title={title}
                leading={<GoBackButton onPress={onCancel} />}
                footer={footer}
                scrollViewProps={scrollViewProps}
            >
                <View className="gap-y-5xl pb-5xl">
                    <RuleSummaryHero />
                    <RuleConditionsSection />
                    <RuleActionsSection ruleId={ruleId} />
                    {children}
                </View>
            </CollapsibleChromePage>
        </RuleFormScrollContext>
    );
};
