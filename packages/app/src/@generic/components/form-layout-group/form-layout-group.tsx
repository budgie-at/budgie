import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly className?: string;
    readonly children: ReactNode;
    readonly variant?: 'horizontal' | 'vertical';
}

const groupVariants = cva('', {
    variants: {
        variant: {
            horizontal: 'flex-row gap-7xl',
            vertical: 'gap-7xl'
        }
    }
});

export const FormLayoutGroup = ({ children, variant = 'vertical', className }: Props) => (
    <View className={cn(groupVariants({ variant }), className)}>{children}</View>
);
