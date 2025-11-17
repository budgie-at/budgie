import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly label?: string;
    readonly error?: string;
    readonly className?: string;
    readonly children: ReactNode;
}

export const FormItem = ({ label, children, className, error }: Props) => (
    <View className={cn('gap-y-lg w-full', className)}>
        {isNotEmptyString(label) ? <Text className="text-secondary-foreground uppercase text-xs">{label}</Text> : null}

        {children}

        {isNotEmptyString(error) ? <Text className="text-destructive-foreground text-xs">{error}</Text> : null}
    </View>
);
