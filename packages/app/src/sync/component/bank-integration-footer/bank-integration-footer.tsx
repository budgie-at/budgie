import { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
    readonly primaryAction: ReactNode;
    readonly secondaryAction: ReactNode;
}

export const BankIntegrationFooter = ({ primaryAction, secondaryAction }: Props) => (
    <View className="gap-md pt-xl px-7xl">
        <View className="flex-row gap-x-md">
            {secondaryAction}
            {primaryAction}
        </View>
    </View>
);
