import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
    readonly value: number;
    readonly className: string;
    readonly children: ReactNode;
}

export const RuleApplyStatusChip = ({ value, className, children }: Props) => (
    <View className="bg-secondary-background border-secondary-corner flex-1 items-center rounded-2xl border px-md py-md">
        <Text className={`text-2xl font-bold ${className}`}>{value}</Text>
        <Text className="text-secondary-foreground mt-xs text-xs uppercase">{children}</Text>
    </View>
);
