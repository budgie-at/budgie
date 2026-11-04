import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { PillButton } from '../pill-button/pill-button';

import type { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof PillButton> {
    readonly caption?: string | null;
}

export const PillButtonFooter = ({ caption, ...props }: Props) => (
    <View className="gap-y-md bg-surface px-5xl pt-lg">
        <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
        {isNotEmptyString(caption) ? (
            <Text className="text-center text-[15px] leading-[20px] text-primary tabular-nums" accessibilityLiveRegion="polite">
                {caption}
            </Text>
        ) : null}
        <PillButton {...props} />
    </View>
);
