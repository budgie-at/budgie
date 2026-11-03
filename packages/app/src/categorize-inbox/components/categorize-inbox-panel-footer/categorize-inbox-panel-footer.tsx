import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { ENTRANCE_EASING } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

import type { ReactElement } from 'react';

interface Props {
    readonly slot: ReactElement;
    readonly leading: ReactElement | null;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const SLOT_DURATION = 220;
const SLOT_REDUCED_DURATION = 150;
const SLOT_DISTANCE = 8;
const SLOT_MOTION = {
    entering: FadeInDown.duration(SLOT_DURATION)
        .easing(ENTRANCE_EASING)
        .withInitialValues({ opacity: 0, transform: [{ translateY: SLOT_DISTANCE }] }),
    exiting: FadeOutDown.duration(SLOT_DURATION).easing(ENTRANCE_EASING)
};
const SLOT_REDUCED_MOTION = { entering: FadeIn.duration(SLOT_REDUCED_DURATION), exiting: FadeOut.duration(SLOT_REDUCED_DURATION) };

export const CategorizeInboxPanelFooter = ({ slot, leading }: Props) => {
    const reducedMotion = useReducedMotion();

    const slotMotion = reducedMotion ? SLOT_REDUCED_MOTION : SLOT_MOTION;

    return (
        <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
            <View
                className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-md"
                testID={CategorizeInboxPanelSelector.Panel}
            >
                {leading}
                <View className="min-h-[52px] justify-center">
                    <Animated.View key={slot.key} entering={slotMotion.entering} exiting={slotMotion.exiting} className="justify-center">
                        {slot}
                    </Animated.View>
                </View>
            </View>
        </ScreenChromeFooter>
    );
};
