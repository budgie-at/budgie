import { Text, View } from 'react-native';

import { testID } from '../../../@generic/utils/test-id.util';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly titleTestID?: string;
    readonly children: ReactNode;
}

export const CategorizeInboxScreenTitle = ({ title, titleTestID, children }: Props) => (
    <View className="gap-y-xs pb-xl pt-md">
        <Text className="text-primary text-3xl font-bold" numberOfLines={2} {...testID(titleTestID)}>
            {title}
        </Text>
        {children}
    </View>
);
