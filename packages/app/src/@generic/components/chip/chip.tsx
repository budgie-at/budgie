import { cva } from 'class-variance-authority';
import { Text, TouchableOpacity } from 'react-native';

import { cn } from '../../utils/cn.util';

interface ChipPropsInterface {
    readonly onPress?: () => void;
    readonly isSelected?: boolean;
    readonly className?: string;
    readonly label: string;
}

const chipVariants = cva('max-w-50 rounded-7xl py-3 px-3xl border', {
    variants: {
        isSelected: {
            true: 'bg-secondary-reverse-background/5 border-secondary-reverse-corner/20',
            false: 'bg-secondary-background border-secondary-corner'
        }
    }
});

export const Chip = ({ label, onPress, className, isSelected = false }: ChipPropsInterface) => (
    <TouchableOpacity className={cn(chipVariants({ isSelected }), className)} disabled={isSelected} onPress={onPress}>
        <Text className={isSelected ? 'text-primary' : 'text-secondary-foreground'} ellipsizeMode="tail" numberOfLines={1}>
            {label}
        </Text>
    </TouchableOpacity>
);
