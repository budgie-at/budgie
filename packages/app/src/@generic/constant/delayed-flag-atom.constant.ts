import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

export const delayedFlagAtom = Atom.family(([isActive, delayMillis]: readonly [boolean, number]) =>
    Atom.make(isActive ? Effect.as(Effect.sleep(delayMillis), true) : Effect.succeed(false)).pipe(
        Atom.map(result => AsyncResult.getOrElse(result, () => false))
    )
);
