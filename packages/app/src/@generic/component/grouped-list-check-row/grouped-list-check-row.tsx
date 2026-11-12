import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';

interface Props {
    readonly titleNumberOfLines?: 0 | 1 | 2;
    readonly subtitle?: string;
    readonly title: string;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const GroupedListCheckRow = ({ title, subtitle, isSelected, onPress, testID, titleNumberOfLines = 1 }: Props) => {
    const pressableProps = { accessibilityState: { selected: isSelected } };

    const subtitleNumberOfLines = titleNumberOfLines === 0 ? 0 : 1;
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={subtitleNumberOfLines} ellipsizeMode="tail">
            {subtitle}
        </Text>
    ) : null;

    return (
        <GroupedListRow
            title={
                <Text className="text-primary text-[17px]" numberOfLines={titleNumberOfLines} ellipsizeMode="tail">
                    {title}
                </Text>
            }
            subtitle={subtitleNode}
            onPress={onPress}
            testID={testID}
            pressableProps={pressableProps}
            right={
                <View className="size-5">
                    {isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
                </View>
            }
        />
    );
};
