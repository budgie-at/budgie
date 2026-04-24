import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { isEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useUncategorizedCountQuery } from '../../query/use-uncategorized-count.query';

import { TransactionUncategorizedFilterSelector } from './transaction-uncategorized-filter.selector';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

const EXIT_DURATION_MS = 180;

const chipVariants = cva('rounded-2xl border px-xl py-sm flex-row items-center gap-x-sm', {
    variants: {
        isActive: {
            true: 'border-primary bg-primary',
            false: 'border-warning-corner bg-warning-background'
        }
    }
});

const textVariants = cva('text-sm', {
    variants: {
        isActive: {
            true: 'text-primary-reverse',
            false: 'text-warning-foreground'
        }
    }
});

export const TransactionUncategorizedFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { count } = useUncategorizedCountQuery();
    const isActive = isEmptyArray(value);

    if (count === 0 && !isActive) {
        return null;
    }

    const handlePress = () => void onChange(isActive ? null : []);

    return (
        <Animated.View entering={FadeInLeft.springify()} exiting={FadeOutLeft.duration(EXIT_DURATION_MS)}>
            <HapticPressable
                className={chipVariants({ isActive })}
                onPress={handlePress}
                testID={TransactionUncategorizedFilterSelector.Chip}
            >
                <Icon icon={UserIconNameEnum.CircleDashed} size={14} className={textVariants({ isActive })} />
                <Text className={textVariants({ isActive })}>{t`Uncategorized (${count})`}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
