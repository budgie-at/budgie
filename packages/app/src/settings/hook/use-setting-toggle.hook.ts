import { SettingsCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { SettingToggleKey } from '../type/setting-toggle-key.type';

export const useSettingToggle = (settingKey: SettingToggleKey, errorTitle?: string) => {
    const { t } = useLingui();

    return (next: boolean) => {
        const input: Partial<Pick<SettingsCreateEntityInterface, SettingToggleKey>> = { [settingKey]: next };

        return appRuntime.runPromise(
            logAndContinue(updateSettingsMutation(input).pipe(toastOnFailure(errorTitle ?? t`Could not update setting`)))
        );
    };
};
