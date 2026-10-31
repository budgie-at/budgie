import { Children, Fragment, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly title: string;
    readonly footnote?: string;
    readonly children: ReactNode;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatsSection = ({ title, footnote, children }: Props) => (
    <View className="gap-y-md">
        <Text accessibilityRole="header" className="px-xs text-lg font-semibold text-primary">
            {title}
        </Text>

        <View className="overflow-hidden rounded-3xl bg-grouped-surface-row" style={continuousCorners}>
            {Children.toArray(children).map((child, index) => (
                <Fragment key={index}>
                    {index > 0 ? <View className="ml-[60px] h-hairline bg-surface-separator" /> : null}
                    {child}
                </Fragment>
            ))}
        </View>

        {isNotEmptyString(footnote) ? <Text className="px-xs text-xs text-secondary-foreground">{footnote}</Text> : null}
    </View>
);
