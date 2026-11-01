import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { RuleActionsSection } from '../rule-actions-section/rule-actions-section';
import { RuleConditionsSection } from '../rule-conditions-section/rule-conditions-section';
import { RuleSummaryHero } from '../rule-summary-hero/rule-summary-hero';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly footer: ReactNode;
    readonly onCancel: () => void;
    readonly ruleId?: number;
    readonly children?: ReactNode;
}

export const RuleFormScreen = ({ title, footer, onCancel, ruleId, children }: Props) => (
    <CollapsibleChromePage title={title} leading={<GoBackButton onPress={onCancel} />} footer={footer}>
        <View className="gap-y-5xl pb-5xl">
            <RuleSummaryHero />
            <RuleConditionsSection />
            <RuleActionsSection ruleId={ruleId} />
            {children}
        </View>
    </CollapsibleChromePage>
);
