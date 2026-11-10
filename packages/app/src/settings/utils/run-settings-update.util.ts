import { t } from '@lingui/core/macro';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import type { SettingsCreateEntityInterface } from '@budgie/contracts';

export const runSettingsUpdate = (input: Partial<SettingsCreateEntityInterface>) =>
    appRuntime.runFork(logAndContinue(updateSettingsMutation(input).pipe(toastOnFailure(t`Could not update settings`))));
