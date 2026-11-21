import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

import type { ReactNode } from 'react';

interface Props {
    readonly title?: string;
    readonly children: ReactNode;
}

export const YieldBreakdownSection = ({ title, children }: Props) => (
    <View className="gap-y-[8px]">
        {isNotEmptyString(title) ? (
            <Text accessibilityRole="header" className="px-3xl text-[17px] font-semibold text-primary" maxFontSizeMultiplier={1.6}>
                {title}
            </Text>
        ) : null}
        <View className="rounded-3xl dark:border-hairline dark:border-surface-separator">
            <GroupedListSection>{children}</GroupedListSection>
        </View>
    </View>
);
