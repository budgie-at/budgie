import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly subtitle?: ReactNode;
    readonly left: ReactNode;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly titleTestID?: string;
    readonly titleLanguage?: string;
}

export const SelectorRow = ({ title, subtitle, left, isSelected, onPress, testID, titleTestID, titleLanguage }: Props) => {
    const check = isSelected ? (
        <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" />
    ) : (
        <View className="w-[22px]" />
    );
    const pressableProps = { accessibilityState: { selected: isSelected } };
    const titleNode = (
        <Text className="text-primary text-[17px]" numberOfLines={2} testID={titleTestID} accessibilityLanguage={titleLanguage}>
            {title}
        </Text>
    );

    return (
        <GroupedListRow
            title={titleNode}
            subtitle={subtitle}
            left={<View className="h-[42px] justify-center">{left}</View>}
            right={check}
            onPress={onPress}
            pressableProps={pressableProps}
            testID={testID}
        />
    );
};
