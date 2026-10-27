import * as Atom from 'effect/reactivity/Atom';
import { AppState } from 'react-native';

import type { AppStateStatus } from 'react-native';

export const appStateAtom = Atom.make<AppStateStatus>(context => {
    const subscription = AppState.addEventListener('change', nextAppState => {
        context.setSelf(nextAppState);
    });

    context.addFinalizer(() => {
        subscription.remove();
    });

    return AppState.currentState;
}).pipe(Atom.keepAlive);
