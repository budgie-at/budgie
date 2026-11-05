import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly leading?: ReactNode;
    readonly inFlow?: boolean;
}

export const FixedChromeHeader = ({ title, leading, inFlow }: Props) => {
    const style = useResolveClassNames('bg-surface');

    return (
        <ScreenChromeHeader style={style} inFlow={inFlow}>
            <View className="absolute inset-0 items-center justify-center px-[60px]" pointerEvents="none">
                <Text className="text-primary text-[17px] font-semibold" accessibilityRole="header" numberOfLines={1}>
                    {title}
                </Text>
            </View>
            {leading}
        </ScreenChromeHeader>
    );
};
