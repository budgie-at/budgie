import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly title?: string;
    readonly footer?: string;
    readonly children: ReactNode;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const GroupedListSection = ({ title, footer, children }: Props) => (
    <View>
        {isNotEmptyString(title) ? (
            <Text className="text-secondary-foreground px-3xl pb-md text-[15px] font-semibold" accessibilityRole="header">
                {title}
            </Text>
        ) : null}

        <View className="overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
            <View className="-mt-px">{children}</View>
        </View>

        {isNotEmptyString(footer) ? (
            <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">{footer}</Text>
        ) : null}
    </View>
);
