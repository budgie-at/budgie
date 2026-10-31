import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly children: ReactNode;
}

export const StatisticsHeroFigureRow = ({ label, children }: Props) => (
    <View accessible className="min-h-[28px] flex-row flex-wrap items-center justify-between gap-x-md">
        <Text className="text-[15px] text-secondary-foreground">{label}</Text>
        {children}
    </View>
);
