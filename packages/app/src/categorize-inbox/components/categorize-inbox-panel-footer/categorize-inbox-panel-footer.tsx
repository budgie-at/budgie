import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { ENTRANCE_DISTANCE, ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { EASE_OUT, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

import type { ReactElement } from 'react';

interface Props {
    readonly slot: ReactElement;
    readonly leading: ReactElement | null;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const SLOT_ENTER_DURATION = 160;
const SLOT_ENTER_DELAY = 40;
const SLOT_EXIT_DURATION = 80;
const SLOT_MOTION = {
    entering: FadeInDown.duration(SLOT_ENTER_DURATION)
        .easing(EASE_OUT)
        .delay(SLOT_ENTER_DELAY)
        .withInitialValues({ opacity: 0, transform: [{ translateY: ENTRANCE_DISTANCE }] }),
    exiting: FadeOut.duration(SLOT_EXIT_DURATION).easing(EASE_OUT)
};
const SLOT_REDUCED_MOTION = {
    entering: FadeIn.duration(ENTRANCE_REDUCED_DURATION).easing(EASE_OUT),
    exiting: FadeOut.duration(SLOT_EXIT_DURATION).easing(EASE_OUT)
};

export const CategorizeInboxPanelFooter = ({ slot, leading }: Props) => {
    const reducedMotion = useReducedMotion();

    const slotMotion = reducedMotion ? SLOT_REDUCED_MOTION : SLOT_MOTION;

    return (
        <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
            <View
                className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-md"
                testID={CategorizeInboxPanelSelector.Panel}
            >
                {isDefined(leading) ? (
                    <Animated.View entering={slotMotion.entering} exiting={MOTION_FADE_OUT}>
                        {leading}
                    </Animated.View>
                ) : null}
                <View className="min-h-[52px] justify-center">
                    <Animated.View key={slot.key} entering={slotMotion.entering} exiting={slotMotion.exiting} className="justify-center">
                        {slot}
                    </Animated.View>
                </View>
            </View>
        </ScreenChromeFooter>
    );
};
