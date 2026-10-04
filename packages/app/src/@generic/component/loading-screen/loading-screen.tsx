import { ActivityIndicator, View } from 'react-native';

import { Page } from '../page/page';

import type { ReactNode } from 'react';

interface Props {
    readonly header?: ReactNode;
}

export const LoadingScreen = ({ header }: Props) => (
    <Page header={header}>
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" colorClassName="accent-primary" />
        </View>
    </Page>
);
