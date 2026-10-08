import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../card/card';

interface Props extends PropsWithChildren {
    readonly title: string;
}

export const StatsSection = ({ title, children }: Props) => (
    <View className="gap-y-md">
        <Text className="uppercase text-secondary-foreground text-xs">{title}</Text>

        <Card size="md" className="gap-y-xl">
            {children}
        </Card>
    </View>
);
