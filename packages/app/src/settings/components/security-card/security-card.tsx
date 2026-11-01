import { useSetting } from '../../hook/use-setting.hook';
import { AppLockRow } from '../app-lock-row/app-lock-row';
import { PinManagementRows } from '../pin-management-rows/pin-management-rows';
import { ScreenshotProtectionRow } from '../screenshot-protection-row/screenshot-protection-row';

export const SecurityCard = () => {
    const isPinEnabled = useSetting('isPinEnabled');

    return (
        <>
            <AppLockRow />
            {isPinEnabled ? <PinManagementRows /> : null}
            <ScreenshotProtectionRow />
        </>
    );
};
