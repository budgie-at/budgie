import { View } from 'react-native';

import { PillButton } from '../pill-button/pill-button';

import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof PillButton>;

export const PillButtonFooter = (props: Props) => (
    <View className="border-t-hairline border-surface-separator bg-surface px-5xl pt-lg">
        <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
        <PillButton {...props} />
    </View>
);
