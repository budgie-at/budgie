import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly leading?: ReactNode;
    readonly title: ReactNode;
    readonly trailing?: ReactNode;
    readonly detail?: ReactNode;
}

export const ListRow = ({ leading, title, trailing, detail }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    if (isAccessibilityTextSize) {
        return (
            <View className="items-start gap-y-sm">
                {leading}
                <View className="gap-y-xxs self-stretch">
                    {title}
                    {detail}
                </View>
                {isDefined(trailing) ? <View className="flex-row">{trailing}</View> : null}
            </View>
        );
    }

    return (
        <View className="min-h-11 flex-row items-center gap-x-xl">
            {leading}
            <View className="min-w-0 flex-1 gap-y-xxs">
                <View className="flex-row items-baseline gap-x-md">
                    <View className="min-w-0 flex-1">{title}</View>
                    {trailing}
                </View>
                {detail}
            </View>
        </View>
    );
};
