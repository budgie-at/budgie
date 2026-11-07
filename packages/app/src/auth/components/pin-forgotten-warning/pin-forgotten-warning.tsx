import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';

const LARGE_TEXT_FONT_SCALE = 1.3;

export const PinForgottenWarning = () => {
    const { fontScale } = useWindowDimensions();
    const layoutClassName = fontScale >= LARGE_TEXT_FONT_SCALE ? 'flex-col gap-y-xs px-md' : 'flex-row gap-x-sm px-5xl';

    return (
        <Animated.View
            entering={FadeIn.duration(PIN_STEP_FADE_DURATION_MS)}
            className={cn('self-stretch items-center justify-center pb-md', layoutClassName)}
        >
            <Icon icon={UserIconNameEnum.TriangleAlert} size={16} className="text-warning-strong" />
            <Text
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                className="min-w-0 max-w-full shrink text-[15px] leading-[22px] font-medium text-primary text-center"
            >
                <Trans>A forgotten PIN can&apos;t be reset.</Trans>
            </Text>
        </Animated.View>
    );
};
