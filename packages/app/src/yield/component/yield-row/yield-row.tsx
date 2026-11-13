import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle: string;
    readonly trailing: string;
    readonly secondary: string;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const YieldRow = ({ left, title, subtitle, trailing, secondary, accessibilityLabel, onPress, testID }: Props) => {
    const pressableProps = { accessibilityLabel };

    const accessory = (
        <View className="flex-row items-center gap-x-sm">
            <View className="items-end">
                <Text className="text-md font-semibold tabular-nums text-primary">{trailing}</Text>
                <Text className="text-xs tabular-nums text-secondary-foreground">{secondary}</Text>
            </View>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    );

    return (
        <View className="min-h-[60px] bg-grouped-surface-row">
            <GroupedListRow
                left={left}
                title={title}
                subtitle={subtitle}
                onPress={onPress}
                testID={testID}
                pressableProps={pressableProps}
                right={accessory}
            />
        </View>
    );
};
