import { SettingsCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { SettingToggleKey } from '../type/setting-toggle-key.type';

export const useSettingToggle = (settingKey: SettingToggleKey) => {
    const { t } = useLingui();

    return async (next: boolean) => {
        const input: Partial<Pick<SettingsCreateEntityInterface, SettingToggleKey>> = { [settingKey]: next };

        try {
            await appRuntime.runPromise(updateSettingsMutation(input));
        } catch (error: unknown) {
            appRuntime.runFork(Effect.logError('failed', { settingKey, errorMessage: getErrorMessage(error) }));
            Toast.show({ type: 'error', text1: t`Could not update setting`, text2: getErrorMessage(error) });
        }
    };
};
