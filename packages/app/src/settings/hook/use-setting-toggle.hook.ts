import { SettingsCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { SettingToggleKey } from '../type/setting-toggle-key.type';

export const useSettingToggle = (settingKey: SettingToggleKey) => {
    const { t } = useLingui();

    return (next: boolean) => {
        const input: Partial<Pick<SettingsCreateEntityInterface, SettingToggleKey>> = { [settingKey]: next };

        return appRuntime.runPromise(
            updateSettingsMutation(input).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catch(error => Effect.sync(() => void showErrorToast(t`Could not update setting`, getErrorMessage(error))))
            )
        );
    };
};
