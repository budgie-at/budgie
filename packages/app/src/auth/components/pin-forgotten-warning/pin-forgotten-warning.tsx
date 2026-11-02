import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';

export const PinForgottenWarning = () => (
    <Animated.View entering={FadeIn.duration(PIN_STEP_FADE_DURATION_MS)} className="flex-row items-center justify-center gap-x-sm px-5xl">
        <Icon icon={UserIconNameEnum.TriangleAlert} size={16} className="text-warning-foreground" />
        <Text className="text-sm text-warning-foreground text-center shrink">
            <Trans>A forgotten PIN can&apos;t be reset.</Trans>
        </Text>
    </Animated.View>
);
