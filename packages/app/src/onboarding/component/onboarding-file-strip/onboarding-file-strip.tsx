import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FileChip } from '../../../@generic/component/file-chip/file-chip';
import { Icon } from '../../../@generic/component/icon/icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';

import { OnboardingFileStripSelector } from './onboarding-file-strip.selector';

const STATE_FADE_DURATION = 180;

interface Props {
    readonly state: string;
    readonly isSealed: boolean;
}

export const OnboardingFileStrip = ({ state, isSealed }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();

    const stateFadeDuration = reducedMotion ? 0 : STATE_FADE_DURATION;
    const stateEntering = FadeIn.duration(stateFadeDuration);
    const stateExiting = FadeOut.duration(stateFadeDuration);
    const stateColorClassName = isSealed ? 'text-positive-foreground' : 'text-secondary-foreground';
    const stateIcon = isSealed ? UserIconNameEnum.Lock : UserIconNameEnum.LockOpen;

    return (
        <FileChip
            testID={OnboardingFileStripSelector.Root}
            icon={UserIconNameEnum.Database}
            name={DB_NAME}
            accessibilityLabel={t`Your data: ${state}`}
        >
            <Animated.View key={state} entering={stateEntering} exiting={stateExiting} className="ml-auto flex-row items-center gap-x-xs">
                <Icon icon={stateIcon} size={12} className={stateColorClassName} />
                <Text testID={OnboardingFileStripSelector.State} numberOfLines={1} className={cn('text-xs', stateColorClassName)}>
                    {state}
                </Text>
            </Animated.View>
        </FileChip>
    );
};
