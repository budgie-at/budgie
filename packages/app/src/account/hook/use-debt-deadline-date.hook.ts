import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';

import { appRuntime } from '../../@generic/runtime/app.runtime';

const debtDeadlineDateAtom = Atom.make(context => {
    const fiber = appRuntime.runFork(
        Effect.gen(function* () {
            const now = new Date(yield* Clock.currentTimeMillis);

            yield* Effect.sleep(startOfDay(addDays(now, 1)).getTime() - now.getTime());
            context.setSelf(new Date(yield* Clock.currentTimeMillis));
        }).pipe(Effect.forever, Effect.tapDefect(Effect.logError))
    );
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
            context.refreshSelf();
        }
    });

    context.addFinalizer(() => {
        subscription.remove();
        void appRuntime.runFork(Fiber.interrupt(fiber));
    });

    return new Date();
}).pipe(Atom.withEquality(isSameDay));

export const useDebtDeadlineDate = (): Date => {
    const now = useAtomValue(debtDeadlineDateAtom);
    const refreshDate = useAtomRefresh(debtDeadlineDateAtom);
    useFocusEffect(refreshDate);

    return now;
};
