import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly textClassName: string;
    readonly children: ReactNode;
}

export const SwipeableRuleCardStatus = ({ icon, iconClassName, textClassName, children }: Props) => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
        <RuleIndicatorPill icon={icon} iconClassName={iconClassName} textClassName={textClassName}>
            {children}
        </RuleIndicatorPill>
    </Animated.View>
);
