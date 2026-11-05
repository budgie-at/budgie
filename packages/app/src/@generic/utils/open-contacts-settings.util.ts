import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';

import { appRuntime } from '../runtime/app.runtime';

export const openContactsSettings = () => {
    appRuntime.runFork(Effect.promise(() => Linking.openSettings()).pipe(Effect.catchCause(Effect.logError)));
};
