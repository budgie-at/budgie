import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { BinanceKeyPermissionsError } from '@budgie/sync';

export const toastBinanceKeyPermissionsError = (error: BinanceKeyPermissionsError) =>
    Effect.sync(() => {
        if (isEmptyArray(error.permissions)) {
            showErrorToast(t`Could not verify the API key permissions`, t`Check the key and secret, then try again.`);

            return;
        }

        showErrorToast(
            t`Key has too many permissions`,
            t`This API key can trade, withdraw or transfer funds. Create a key with only "Enable Reading" and try again.`
        );
    });
