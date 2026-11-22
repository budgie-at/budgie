import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly body: string;
    readonly children?: ReactNode;
}

export const YieldInfoSheetBlock = ({ title, body, children }: Props) => (
    <View className="gap-y-xs">
        <Text className="text-[15px] font-semibold leading-[20px] text-primary">{title}</Text>
        <Text className="text-[15px] leading-[20px] text-primary">{body}</Text>
        {children}
    </View>
);
