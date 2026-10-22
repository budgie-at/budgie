import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { useSetting } from '../../hook/use-setting.hook';
import { AppLockRow } from '../app-lock-row/app-lock-row';
import { PinManagementRows } from '../pin-management-rows/pin-management-rows';
import { ScreenshotProtectionRow } from '../screenshot-protection-row/screenshot-protection-row';

export const SecurityCard = () => {
    const isPinEnabled = useSetting('isPinEnabled');

    return (
        <Card variant="secondary" size="sm" className="px-3xl py-0">
            <AppLockRow />
            {isPinEnabled ? <PinManagementRows /> : null}
            <View className="border-t border-secondary-corner">
                <ScreenshotProtectionRow />
            </View>
        </Card>
    );
};
