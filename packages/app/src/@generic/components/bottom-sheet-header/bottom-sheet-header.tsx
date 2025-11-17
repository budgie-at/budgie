import { Text, View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly title: string;
    readonly className?: string;
    readonly description: string;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
}

export const BottomSheetHeader = ({ title, description, className, titleClassName, descriptionClassName }: Props) => (
    <View className={cn('gap-y-1 py-3xl px-lg', className)}>
        <Text className={cn('text-center text-xl text-primary font-semibold', titleClassName)}>{title}</Text>
        <Text className={cn('text-center text-sm text-secondary-foreground', descriptionClassName)}>{description}</Text>
    </View>
);
