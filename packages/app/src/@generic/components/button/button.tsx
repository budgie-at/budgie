import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, Text } from 'react-native';

import { EmptyFn, emptyFn } from '@rnw-community/shared';

import { useVibration } from '../../hooks/use-vibration.hook';
import { cn } from '../../utils/cn.util';

interface Props {
    content: string;
    onPress?: EmptyFn;
    isDisabled?: boolean;
    className?: string;
}

const buttonVariants = cva('rounded-[16px] items-center p-[15.5px]', {
    variants: {
        isDisabled: {
            true: 'bg-primary/50',
            false: 'bg-primary'
        }
    }
});

export const Button = ({ className, content, onPress = emptyFn, isDisabled = false }: Props) => {
    const [, hapticImpact] = useVibration();

    const handlePress = () => {
        onPress();
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <Pressable onPress={handlePress} className={cn(buttonVariants({ isDisabled }), className)}>
            <Text className={'text-primary-reverse text-[16px] font-semibold'}>{content}</Text>
        </Pressable>
    );
};
