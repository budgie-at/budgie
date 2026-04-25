import { TransactionCategoryFilterModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useUncategorizedCountQuery } from '../../query/use-uncategorized-count.query';

import { TransactionUncategorizedFilterSelector } from './transaction-uncategorized-filter.selector';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly onPress: EmptyFn;
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

export const TransactionUncategorizedFilter = ({ filters, onPress }: Props) => {
    const { t } = useLingui();
    const { count } = useUncategorizedCountQuery(filters);
    const isActive = filters.categoryMode === TransactionCategoryFilterModeEnum.UNCATEGORIZED;

    if (count === 0 && !isActive) {
        return null;
    }

    return (
        <Animated.View entering={FadeInLeft.springify()} exiting={FadeOutLeft.duration(EXIT_DURATION_MS)}>
            <HapticPressable className={chipVariants({ isActive })} onPress={onPress} testID={TransactionUncategorizedFilterSelector.Chip}>
                <Icon icon={UserIconNameEnum.CircleDashed} size={14} className={textVariants({ isActive })} />
                <Text className={textVariants({ isActive })}>{t`Uncategorized (${count})`}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
