import { View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { SCREEN_CHROME_CONFIG } from '../../../@generic/constant/screen-chrome-config.constant';
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

const RULE_FORM_CHROME_CONFIG = { ...SCREEN_CHROME_CONFIG, bottomFadeHeight: 128 };

export const RuleFormScreen = ({ title, footer, onCancel, ruleId, children }: Props) => {
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);

    return (
        <CollapsibleChromePage
            title={title}
            leading={<GoBackButton onPress={onCancel} />}
            {...(!isKeyboardVisible && { footer })}
            chromeConfig={RULE_FORM_CHROME_CONFIG}
        >
            <View className="gap-y-5xl pb-[72px]">
                <RuleSummaryHero />
                <RuleConditionsSection />
                <RuleActionsSection ruleId={ruleId} />
                {children}
            </View>
        </CollapsibleChromePage>
    );
};
