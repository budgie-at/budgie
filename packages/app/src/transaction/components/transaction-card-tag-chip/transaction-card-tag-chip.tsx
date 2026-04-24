import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly isPrimary?: boolean;
    readonly isDimmed?: boolean;
    readonly onPress?: () => void;
    readonly onLongPress?: () => void;
    readonly testID?: string;
}

const chipVariants = cva('flex-row items-center gap-x-xs rounded-full px-sm py-[2px] border', {
    variants: {
        isPrimary: {
            true: 'border-primary/40 bg-primary/10',
            false: 'border-secondary-corner'
        },
        isDimmed: {
            true: 'opacity-50',
            false: 'opacity-100'
        }
    },
    defaultVariants: { isPrimary: false, isDimmed: false }
});

const textVariants = cva('text-xs', {
    variants: {
        isPrimary: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    },
    defaultVariants: { isPrimary: false }
});

export const TransactionCardTagChip = ({ title, isPrimary = false, isDimmed = false, onPress, onLongPress, testID }: Props) => {
    const iconClassName = textVariants({ isPrimary });

    const body = (
        <View className={chipVariants({ isPrimary, isDimmed })}>
            <Icon icon={UserIconNameEnum.Tag} size={12} className={iconClassName} />
            <Text className={textVariants({ isPrimary })} numberOfLines={1} ellipsizeMode="tail">
                {title}
            </Text>
        </View>
    );

    if (!isDefined(onPress) && !isDefined(onLongPress)) {
        return body;
    }

    return (
        <HapticPressable onPress={onPress} onLongPress={onLongPress} testID={testID}>
            {body}
        </HapticPressable>
    );
};
