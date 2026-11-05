import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

import type { ReactNode } from 'react';

interface Props {
    readonly number: number;
    readonly children: ReactNode;
    readonly onPress?: () => void;
}

export const SyncGuideStep = ({ number, children, onPress }: Props) => (
    <GroupedListRow
        left={
            <View className="size-[36px] items-center justify-center self-start rounded-full bg-surface-disc">
                <Text className="text-[15px] font-semibold text-primary">{number}</Text>
            </View>
        }
        title={<Text className="text-[15px] leading-[21px] text-primary">{children}</Text>}
        onPress={onPress}
    />
);
