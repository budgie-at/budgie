import { SettingsCreateEntityInterface } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { WidgetSettingKey } from '../type/widget-setting-key.type';

const logger = getLogger('WidgetSettingToggle');

export const useWidgetSettingToggle = (settingKey: WidgetSettingKey) => {
    const { t } = useLingui();

    return async (next: boolean) => {
        const input: Partial<Pick<SettingsCreateEntityInterface, WidgetSettingKey>> = { [settingKey]: next };

        try {
            await updateSettingsMutation(input);
        } catch (error: unknown) {
            logger.error('failed', { settingKey, errorMessage: getErrorMessage(error) });
            Toast.show({ type: 'error', text1: t`Could not update widget setting`, text2: getErrorMessage(error) });
        }
    };
};
