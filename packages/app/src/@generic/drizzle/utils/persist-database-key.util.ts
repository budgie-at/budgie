import * as Effect from 'effect/Effect';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { PIN_KEY } from '../../../auth/constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../../../auth/constant/pin-secure-store-options.constant';

export const persistDatabaseKey = (key: string | null) =>
    Effect.promise(() =>
        isNotEmptyString(key)
            ? SecureStore.setItemAsync(PIN_KEY, key, PIN_SECURE_STORE_OPTIONS)
            : SecureStore.deleteItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS)
    );
