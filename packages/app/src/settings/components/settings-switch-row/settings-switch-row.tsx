import { UserIconType } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: ReactNode;
    readonly value: boolean;
    readonly isLoading: boolean;
    readonly testID: string;
    readonly switchTestID: string;
    readonly onChange?: (next: boolean) => void;
}

export const SettingsSwitchRow = ({ icon, title, subtitle, value, isLoading, testID, switchTestID, onChange }: Props) => {
    const [, , hapticSelection] = useVibration();

    const isInteractive = isDefined(onChange);
    const isDisabled = !isInteractive && !isLoading;
    const handleSwitchChange = (next: boolean) => {
        hapticSelection();
        onChange?.(next);
    };
    const handlePress = () => handleSwitchChange(!value);
    const pressableProps = {
        accessible: true,
        accessibilityRole: 'switch' as const,
        accessibilityState: { checked: value, disabled: isDisabled }
    };

    return (
        <GroupedListRow
            left={<SettingsRowIcon icon={icon} variant="ghost" />}
            title={title}
            subtitle={subtitle}
            testID={testID}
            {...(isInteractive && { onPress: handlePress })}
            pressableProps={pressableProps}
            right={
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <LoadingContent isLoading={isLoading}>
                        <ThemedSwitch
                            value={value}
                            onValueChange={handleSwitchChange}
                            disabled={!isInteractive}
                            accessibilityLabel={title}
                            testID={switchTestID}
                        />
                    </LoadingContent>
                </View>
            }
        />
    );
};
