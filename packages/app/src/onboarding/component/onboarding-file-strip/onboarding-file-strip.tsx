import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FileChip } from '../../../@generic/component/file-chip/file-chip';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';

import { OnboardingFileStripSelector } from './onboarding-file-strip.selector';

const STATE_FADE_DURATION = 180;

const LOCK_ICON: Record<OnboardingFileLockEnum, UserIconNameEnum> = {
    [OnboardingFileLockEnum.OPEN]: UserIconNameEnum.LockOpen,
    [OnboardingFileLockEnum.PHONE]: UserIconNameEnum.Smartphone,
    [OnboardingFileLockEnum.SEALED]: UserIconNameEnum.Lock
};

const LOCK_COLOR_CLASS_NAME: Record<OnboardingFileLockEnum, string> = {
    [OnboardingFileLockEnum.OPEN]: 'text-secondary-foreground',
    [OnboardingFileLockEnum.PHONE]: 'text-secondary-foreground',
    [OnboardingFileLockEnum.SEALED]: 'text-primary'
};

interface Props {
    readonly state: string;
    readonly lock: OnboardingFileLockEnum;
}

export const OnboardingFileStrip = ({ state, lock }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();

    const stateFadeDuration = reducedMotion ? 0 : STATE_FADE_DURATION;
    const stateEntering = FadeIn.duration(stateFadeDuration);
    const stateExiting = FadeOut.duration(stateFadeDuration);
    const stateColorClassName = LOCK_COLOR_CLASS_NAME[lock];
    const stateIcon = LOCK_ICON[lock];

    return (
        <FileChip
            testID={OnboardingFileStripSelector.Root}
            icon={UserIconNameEnum.Database}
            name={DB_NAME}
            accessibilityLabel={t`Your data: ${state}`}
        >
            <Animated.View
                key={state}
                entering={stateEntering}
                exiting={stateExiting}
                className="min-w-0 flex-1 flex-row items-center justify-end gap-x-xs flex-wrap gap-y-xs"
            >
                <Icon icon={stateIcon} size={14} className={stateColorClassName} />
                <Text
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    testID={OnboardingFileStripSelector.State}
                    className={cn('shrink text-right text-[13px]', stateColorClassName)}
                >
                    {state}
                </Text>
            </Animated.View>
        </FileChip>
    );
};
