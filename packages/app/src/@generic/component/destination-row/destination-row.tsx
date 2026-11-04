import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';
import { SelectorRowTitle } from '../selector-row-title/selector-row-title';

import type { ReactNode } from 'react';

interface Props {
    readonly id: number;
    readonly title: string;
    readonly subtitle: string | null;
    readonly left: ReactNode;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
    readonly onSelect: (id: number) => void;
    readonly testID?: string;
}

export const DestinationRow = ({ id, title, subtitle, left, isSelected, isDisabled, onSelect, testID }: Props) => {
    const handlePress = () => void onSelect(id);
    const pressableProps = { disabled: isDisabled, accessibilityState: { selected: isSelected, disabled: isDisabled } };
    const checkmark = isSelected ? <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" /> : false;

    return (
        <GroupedListRow
            title={<SelectorRowTitle text={title} isSelected={isSelected} />}
            subtitle={subtitle}
            left={
                <View className="min-h-[42px] justify-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {left}
                </View>
            }
            right={checkmark}
            onPress={handlePress}
            pressableProps={pressableProps}
            testID={testID}
        />
    );
};
