import Animated from 'react-native-reanimated';

import { useScrollFadeStyle } from '@rnw-community/react-native-screen-chrome';

import { CategorizeInboxNavTitle } from '../categorize-inbox-nav-title/categorize-inbox-nav-title';

interface Props {
    readonly children: string;
}

const HERO_TITLE_SCROLL_RANGE = [26, 44] as const;
const FADE_IN_OPACITY = [0, 1] as const;

export const CategorizeInboxCollapsingNavTitle = ({ children }: Props) => {
    const fadeStyle = useScrollFadeStyle(HERO_TITLE_SCROLL_RANGE, FADE_IN_OPACITY);

    return (
        <Animated.View className="self-stretch" style={fadeStyle}>
            <CategorizeInboxNavTitle>{children}</CategorizeInboxNavTitle>
        </Animated.View>
    );
};
