import * as Effect from 'effect/Effect';
import * as SecureStore from 'expo-secure-store';

import { PIN_KEY } from '../../../auth/constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../../../auth/constant/pin-secure-store-options.constant';

export const readDatabaseKey = Effect.promise(() => SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
