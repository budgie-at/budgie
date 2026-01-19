import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

const bannerVariants = cva('flex-row items-center gap-3 p-3 rounded-xl', {
    variants: {
        severity: {
            warning: 'bg-warning-background',
            destructive: 'bg-destructive-background'
        }
    },
    defaultVariants: {
        severity: 'warning'
    }
});

const contentVariants = cva('', {
    variants: {
        severity: {
            warning: 'text-warning-foreground',
            destructive: 'text-destructive-foreground'
        }
    },
    defaultVariants: {
        severity: 'warning'
    }
});

type Severity = 'warning' | 'destructive';

interface Props {
    readonly message: string;
    readonly severity: Severity;
    readonly onDismiss: () => void;
}

export const BudgetAlertBanner = ({ message, severity, onDismiss }: Props) => (
    <View className={bannerVariants({ severity })}>
        <Icon icon={UserIconNameEnum.TriangleAlert} className={contentVariants({ severity })} size={20} />
        <Text className={cn('flex-1 text-sm font-medium', contentVariants({ severity }))}>{message}</Text>
        <Pressable onPress={onDismiss} hitSlop={8}>
            <Icon icon={UserIconNameEnum.X} className={contentVariants({ severity })} size={16} />
        </Pressable>
    </View>
);
