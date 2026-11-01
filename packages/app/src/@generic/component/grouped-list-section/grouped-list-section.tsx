import { Text, View } from 'react-native';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../grouped-list-section-title/grouped-list-section-title';

import type { ReactNode } from 'react';

interface Props {
    readonly title?: string;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const GroupedListSection = ({ title, footer, children }: Props) => (
    <View>
        {isNotEmptyString(title) ? <GroupedListSectionTitle title={title} /> : null}

        <View className="overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
            <View className="-mt-px">{children}</View>
        </View>

        {isString(footer) ? <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">{footer}</Text> : footer}
    </View>
);
