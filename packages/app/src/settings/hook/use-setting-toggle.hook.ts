import { SettingsCreateEntityInterface } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { SettingToggleKey } from '../type/setting-toggle-key.type';

const logger = getLogger('SettingToggle');

export const useSettingToggle = (settingKey: SettingToggleKey) => {
    const { t } = useLingui();

    return async (next: boolean) => {
        const input: Partial<Pick<SettingsCreateEntityInterface, SettingToggleKey>> = { [settingKey]: next };

        try {
            await updateSettingsMutation(input);
        } catch (error: unknown) {
            logger.error('failed', { settingKey, errorMessage: getErrorMessage(error) });
            Toast.show({ type: 'error', text1: t`Could not update setting`, text2: getErrorMessage(error) });
        }
    };
};
