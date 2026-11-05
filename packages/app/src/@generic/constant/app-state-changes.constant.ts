import * as Effect from 'effect/Effect';
import * as Queue from 'effect/Queue';
import * as Stream from 'effect/Stream';
import { AppState } from 'react-native';

import type { AppStateStatus } from 'react-native';

export const appStateChanges = Stream.callback<AppStateStatus>(queue =>
    Effect.acquireRelease(
        Effect.sync(() =>
            AppState.addEventListener('change', state => {
                Queue.offerUnsafe(queue, state);
            })
        ),
        subscription =>
            Effect.sync(() => {
                subscription.remove();
            })
    )
);
