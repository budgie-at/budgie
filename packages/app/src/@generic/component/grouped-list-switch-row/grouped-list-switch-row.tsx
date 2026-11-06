import { useVibration } from '../../hook/use-vibration.hook';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { ThemedSwitch } from '../themed-switch/themed-switch';

import type { ReactNode } from 'react';
import type { AccessibilityProps } from 'react-native';

interface Props extends Pick<AccessibilityProps, 'accessibilityHint'> {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle: string;
    readonly value: boolean | undefined;
    readonly testID?: string;
    readonly titleTestID?: string;
    readonly switchTestID: string;
    readonly onChange: (value: boolean) => void;
}

export const GroupedListSwitchRow = ({
    left,
    title,
    subtitle,
    value,
    testID,
    titleTestID,
    switchTestID,
    onChange,
    accessibilityHint
}: Props) => {
    const [, , hapticSelection] = useVibration();

    const handleSwitchChange = (next: boolean) => {
        hapticSelection();
        onChange(next);
    };
    const handlePress = () => handleSwitchChange(!value);
    const pressableProps = { accessibilityRole: 'switch' as const, accessibilityHint, accessibilityState: { checked: value } };

    return (
        <GroupedListRow
            left={left}
            title={title}
            subtitle={subtitle}
            testID={testID}
            titleTestID={titleTestID}
            onPress={handlePress}
            pressableProps={pressableProps}
            right={
                <ThemedSwitch
                    value={value}
                    onValueChange={handleSwitchChange}
                    accessibilityLabel={title}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID={switchTestID}
                />
            }
        />
    );
};
