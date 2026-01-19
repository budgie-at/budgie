import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

const badgeVariants = cva('min-w-5 h-5 rounded-full items-center justify-center px-sm', {
    variants: {
        severity: {
            warning: 'bg-warning-corner',
            destructive: 'bg-destructive-background'
        }
    },
    defaultVariants: {
        severity: 'warning'
    }
});

const textVariants = cva('text-xs font-semibold', {
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

interface Props {
    readonly count: number;
    readonly hasExceeded: boolean;
}

export const BudgetAlertBadge = ({ count, hasExceeded }: Props) => {
    if (!isPositiveNumber(count)) {
        return null;
    }

    const severity = hasExceeded ? 'destructive' : 'warning';

    return (
        <View className={badgeVariants({ severity })}>
            <Text className={textVariants({ severity })}>{count}</Text>
        </View>
    );
};
