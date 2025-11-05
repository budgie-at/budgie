import { cva } from 'class-variance-authority';
import { Pressable, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import type { LucideIcon } from 'lucide-react-native';

interface Props {
    readonly onPress?: () => void;
    readonly isSelected?: boolean;
    readonly className?: string;
    readonly icon?: LucideIcon;
    readonly label: string;
}

const chipVariants = cva('max-w-50 rounded-5xl py-3 px-3xl gap-x-2 border items-center flex-row', {
    variants: {
        isSelected: {
            true: 'bg-secondary-reverse-background/5 border-secondary-reverse-corner/20',
            false: 'bg-secondary-background border-secondary-corner'
        }
    }
});

const iconVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const Chip = ({ label, onPress, className, isSelected = false, icon }: Props) => {
    // TODO: Can we use variant or helper?
    const textClassName = isSelected ? 'text-primary' : 'text-secondary-foreground';

    return (
        <Pressable className={cn(chipVariants({ isSelected }), className)} disabled={isSelected} onPress={onPress}>
            {isDefined(icon) && <Icon className={iconVariants({ isSelected })} icon={icon} size={16} />}

            <Text className={textClassName} ellipsizeMode="tail" numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
};
