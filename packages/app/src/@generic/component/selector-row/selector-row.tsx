import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isString } from '@rnw-community/shared';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';
import { SelectorRowTitle } from '../selector-row-title/selector-row-title';

import type { ReactElement, ReactNode } from 'react';

interface Props {
    readonly title: string | ReactElement;
    readonly subtitle?: ReactNode;
    readonly left: ReactNode;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly titleTestID?: string;
}

export const SelectorRow = ({ title, subtitle, left, isSelected, onPress, testID, titleTestID }: Props) => {
    const check = isSelected ? (
        <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" />
    ) : (
        <View className="w-[22px]" />
    );
    const pressableProps = { accessibilityState: { selected: isSelected } };
    const titleNode = isString(title) ? <SelectorRowTitle text={title} testID={titleTestID} /> : title;

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
