import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly label?: string;
    readonly error?: string;
    readonly className?: string;
    readonly children: ReactNode;
    readonly isRequired?: boolean;
}

export const FormItem = ({ label, children, className, error, isRequired }: Props) => (
    <View className={cn('gap-y-lg', className)}>
        {isNotEmptyString(label) ? (
            <View className="flex-row items-center">
                <Text className="text-secondary-foreground uppercase text-xs">{label}</Text>
                {isRequired && <Text className="text-destructive-foreground text-sm">*</Text>}
            </View>
        ) : null}

        {children}

        {isNotEmptyString(error) ? <Text className="text-destructive-foreground text-xs">{error}</Text> : null}
    </View>
);
