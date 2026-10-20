import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { SEAL_UNLOCK_GRANT_KEY } from '../constant/seal-unlock-grant-key.constant';

const SEAL_UNLOCK_GRANT_MAX_AGE_MS = 60_000;

export const hasFreshSealUnlockGrant = (): boolean => {
    const grantedAt = SecureStore.getItem(SEAL_UNLOCK_GRANT_KEY, PIN_SECURE_STORE_OPTIONS);

    if (!isNotEmptyString(grantedAt)) {
        return false;
    }

    const grantAge = Date.now() - Number(grantedAt);

    return grantAge >= 0 && grantAge < SEAL_UNLOCK_GRANT_MAX_AGE_MS;
};
