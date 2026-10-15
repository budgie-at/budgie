import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';

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
        <View
            testID={OnboardingFileStripSelector.Root}
            accessible
            accessibilityLabel={t`Your data: ${state}`}
            className="flex-1 flex-row items-center gap-x-md rounded-3xl border border-secondary-corner bg-secondary-background px-lg py-md"
        >
            <Icon icon={UserIconNameEnum.Database} size={16} className="text-primary" />
            <Text className="text-primary text-xs font-semibold">{DB_NAME}</Text>

            <Animated.View key={state} entering={stateEntering} exiting={stateExiting} className="ml-auto flex-row items-center gap-x-xs">
                <Icon icon={stateIcon} size={12} className={stateColorClassName} />
                <Text testID={OnboardingFileStripSelector.State} numberOfLines={1} className={`text-xs ${stateColorClassName}`}>
                    {state}
                </Text>
            </Animated.View>
        </View>
    );
};
