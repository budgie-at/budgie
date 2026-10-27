import * as Effect from 'effect/Effect';

export const reloadApp = Effect.promise(() => import('expo-updates/build/Updates')).pipe(
    Effect.flatMap(updatesModule => Effect.promise(() => updatesModule.reloadAsync()))
);
