import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MOTION_FADE_IN } from '../../../@generic/constant/motion.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';
import { FILTER_CHIP_HIT_SLOP } from '../../constant/filter-chip-hit-slop.constant';

import { UncategorizedTransactionsPillSelector } from './uncategorized-transactions-pill.selector';

interface Props {
    readonly count: number;
    readonly onPress: () => void;
}

export const UncategorizedTransactionsPill = ({ count, onPress }: Props) => {
    const { t } = useLingui();

    const pillText = t({
        message: plural(count, {
            one: '# uncategorized',
            other: '# uncategorized'
        })
    });

    return (
        <Animated.View entering={MOTION_FADE_IN} className="-my-[6px] py-[6px]">
            <HapticPressable
                hitSlop={FILTER_CHIP_HIT_SLOP}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={pillText}
                testID={UncategorizedTransactionsPillSelector.Button}
                className={cn(FILTER_CHIP_CLASS_NAME, 'bg-attention-background')}
            >
                <Text className="text-attention-foreground text-[13px] font-semibold" numberOfLines={1}>
                    {pillText}
                </Text>
                <Icon icon={UserIconNameEnum.ChevronRight} size={13} className="text-attention-foreground" />
            </HapticPressable>
        </Animated.View>
    );
};
