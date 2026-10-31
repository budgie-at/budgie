import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly tile: ReactNode;
    readonly label: string;
    readonly error?: string;
    readonly children: ReactNode;
}

export const IconTitleField = ({ tile, label, error, children }: Props) => (
    <View className="px-3xl py-lg">
        <View className="flex-row items-center gap-x-xl">
            {tile}
            <View className="flex-1">
                <Text className="text-secondary-foreground text-[13px]" importantForAccessibility="no" accessibilityElementsHidden>
                    {label}
                </Text>
                {children}
            </View>
        </View>
        {isNotEmptyString(error) ? <Text className="text-destructive-foreground pl-[48px] text-[13px]">{error}</Text> : null}
    </View>
);
