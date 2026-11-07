import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../hook/use-vibration.hook';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { LoadingContent } from '../loading-content/loading-content';
import { ThemedSwitch } from '../themed-switch/themed-switch';

import type { ComponentProps } from 'react';
import type { AccessibilityProps } from 'react-native';

interface Props
    extends
        Pick<AccessibilityProps, 'accessibilityHint'>,
        Pick<ComponentProps<typeof GroupedListRow>, 'left' | 'subtitle' | 'testID' | 'titleTestID'> {
    readonly title: string;
    readonly value: boolean | undefined;
    readonly isLoading?: boolean;
    readonly switchTestID: string;
    readonly onChange?: (value: boolean) => void;
}

export const GroupedListSwitchRow = ({
    left,
    title,
    subtitle,
    value,
    isLoading = false,
    testID,
    titleTestID,
    switchTestID,
    onChange,
    accessibilityHint
}: Props) => {
    const [, , hapticSelection] = useVibration();

    const isInteractive = isDefined(onChange);
    const handleSwitchChange = (next: boolean) => {
        hapticSelection();
        onChange?.(next);
    };
    const handlePress = () => {
        handleSwitchChange(!value);
    };
    const pressableProps = {
        accessible: true,
        accessibilityRole: 'switch' as const,
        accessibilityHint,
        accessibilityState: { checked: value, disabled: !isInteractive }
    };

    return (
        <GroupedListRow
            left={left}
            title={title}
            subtitle={subtitle}
            testID={testID}
            titleTestID={titleTestID}
            {...(isInteractive && { onPress: handlePress })}
            pressableProps={pressableProps}
            right={
                <LoadingContent isLoading={isLoading}>
                    <ThemedSwitch
                        value={value}
                        onValueChange={handleSwitchChange}
                        disabled={!isInteractive}
                        accessibilityLabel={title}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        testID={switchTestID}
                    />
                </LoadingContent>
            }
        />
    );
};
