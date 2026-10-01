import * as Effect from 'effect/Effect';
import * as SecureStore from 'expo-secure-store';

import { getErrorMessage } from '@rnw-community/shared';

import { PIN_KEY } from '../../../auth/constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../../../auth/constant/pin-secure-store-options.constant';

export const readDatabaseKey = Effect.tryPromise(() => SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS)).pipe(
    Effect.catch(secureStoreError =>
        Effect.logError('secure-store:read-pin-error', { errorMessage: getErrorMessage(secureStoreError) }).pipe(Effect.as(null))
    )
);
