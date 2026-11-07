import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { ThemedSwitch } from '../themed-switch/themed-switch';

import type { ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle?: string;
    readonly value: boolean | undefined;
    readonly testID?: string;
    readonly titleTestID?: string;
    readonly switchTestID: string;
    readonly onChange: (value: boolean) => void;
}

export const GroupedListSwitchRow = ({ left, title, subtitle, value, testID, titleTestID, switchTestID, onChange }: Props) => {
    const handlePress = () => void onChange(!value);
    const pressableProps = { accessibilityState: { checked: value } };

    return (
        <GroupedListRow
            left={left}
            title={title}
            subtitle={subtitle}
            testID={testID}
            titleTestID={titleTestID}
            onPress={handlePress}
            pressableProps={pressableProps}
            right={<ThemedSwitch value={value} onValueChange={onChange} accessibilityLabel={title} testID={switchTestID} />}
        />
    );
};
