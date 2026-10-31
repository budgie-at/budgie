import { View } from 'react-native';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';

import type { ReactNode } from 'react';

interface Props {
    readonly id: number;
    readonly title: string;
    readonly subtitle: string | null;
    readonly left: ReactNode;
    readonly onSelect: (id: number) => void;
    readonly testID?: string;
}

export const DestinationRow = ({ id, title, subtitle, left, onSelect, testID }: Props) => {
    const handlePress = () => void onSelect(id);

    return (
        <GroupedListRow
            title={title}
            subtitle={subtitle}
            left={
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {left}
                </View>
            }
            right={false}
            onPress={handlePress}
            testID={testID}
        />
    );
};
