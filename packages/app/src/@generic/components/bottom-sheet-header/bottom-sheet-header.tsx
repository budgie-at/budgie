import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { BottomSheetHeaderAlign } from '../../type/bottom-sheet-header-align.type';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly size: 'sm' | 'md' | 'lg';
    readonly title: string;
    readonly className?: string;
    readonly description: string;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly align?: BottomSheetHeaderAlign;
}

const headerVariant = cva('gap-y-1 py-3xl px-lg', {
    variants: {
        align: {
            center: 'justify-center',
            start: 'justify-start'
        }
    }
});

const titleVariants = cva('text-center text-primary font-semibold', {
    variants: {
        size: {
            sm: 'text-md',
            md: 'text-xl',
            lg: 'text-3xl'
        },
        align: {
            center: 'text-center',
            start: 'text-start'
        }
    }
});

const descriptionVariants = cva('text-center text-secondary-foreground', {
    variants: {
        size: {
            sm: 'text-sm',
            md: 'text-sm',
            lg: 'text-sm'
        },
        align: {
            center: 'text-center',
            start: 'text-start'
        }
    }
});

export const BottomSheetHeader = (props: Props) => {
    const { size = 'md', align = 'center', title, description, className, titleClassName, descriptionClassName } = props;

    return (
        <View className={cn(headerVariant({ align }), className)}>
            <Text className={cn(titleVariants({ size, align }), titleClassName)}>{title}</Text>
            <Text className={cn(descriptionVariants({ size, align }), descriptionClassName)}>{description}</Text>
        </View>
    );
};
