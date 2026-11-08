import { isDefined } from '@rnw-community/shared';

import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
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
    const isInteractive = isDefined(onChange);
    const handlePress = () => {
        onChange?.(!value);
    };
    const pressableProps = {
        accessible: true,
        pressFeedback: HapticPressFeedbackEnum.SELECTION,
        accessibilityRole: 'switch' as const,
        accessibilityHint,
        accessibilityState: { checked: value, disabled: !isInteractive, busy: isLoading }
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
                        onValueChange={onChange}
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
